import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getIO } from "../socket.js";

// Send a message
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
	const { receiverId, text, attachments, conversationId: clientConversationId } =
		req.body;

	validateRequest([
		{
			field: "receiverId",
			value: receiverId,
			rules: { required: true, type: "string" },
		},
		{
			field: "text",
			value: text,
			rules: { required: true, type: "string", minLength: 1 },
		},
	]);

	const senderId = req.user?.id;
	if (!senderId) {
		throw new ApiError("Unauthorized", 401);
	}

	const receiver = await User.findById(receiverId);
	if (!receiver) {
		throw new ApiError("Receiver not found", 404);
	}

	// Determine conversation ID
	// If client provides one, use it to allow multiple conversations between same users.
	// Otherwise, fall back to the legacy pair-based conversation ID for backward compatibility.
	const conversationId: string = clientConversationId
		? String(clientConversationId)
		: [senderId, receiverId].sort().join("-");

	const message = await Message.create({
		conversationId,
		senderId,
		receiverId,
		senderType: req.user?.role === "patient" ? "patient" : "Doctor",
		text,
		attachments,
		status: "sent",
	});

	const populatedMessage = await Message.findById(message._id)
		.populate("senderId", "firstName lastName role")
		.populate("receiverId", "firstName lastName role");

	try {
		const io = getIO();
		if (populatedMessage) {
			io.to(receiverId.toString()).emit("message:new", populatedMessage);
			io.to(senderId.toString()).emit("message:sent", populatedMessage);
		}
	} catch (error) {
		// Socket server might not be initialized in some environments; ignore errors here
	}

	return res.sendResponse({
		statusCode: 201,
		success: true,
		message: "Message sent successfully",
		data: populatedMessage,
	});
});

// Get conversation between two users
export const getConversation = asyncHandler(
	async (req: Request, res: Response) => {
		const { userId } = req.params;
		const { page = 1, limit = 50 } = req.query;

		const currentUserId = req.user?.id;
		if (!currentUserId) {
			throw new ApiError("Unauthorized", 401);
		}

		const conversationId = [currentUserId, userId].sort().join("-");

		const skip = (Number(page) - 1) * Number(limit);

		const [messages, total] = await Promise.all([
			Message.find({ conversationId })
				.populate("senderId", "firstName lastName role")
				.populate("receiverId", "firstName lastName role")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit)),
			Message.countDocuments({ conversationId }),
		]);

		// Mark messages as read
		await Message.updateMany(
			{
				conversationId,
				receiverId: currentUserId,
				status: { $ne: "read" },
			},
			{
				$set: { status: "read", readAt: new Date() },
			}
		);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Conversation retrieved successfully",
			data: {
				messages: messages.reverse(), // Most recent at bottom
				pagination: {
					currentPage: Number(page),
					totalPages: Math.ceil(total / Number(limit)),
					total,
					limit: Number(limit),
				},
			},
		});
	}
);

// Get conversation by conversationId
export const getConversationById = asyncHandler(
	async (req: Request, res: Response) => {
		const { conversationId } = req.params;
		const { page = 1, limit = 50 } = req.query;

		const currentUserId = req.user?.id;
		if (!currentUserId) {
			throw new ApiError("Unauthorized", 401);
		}

		const skip = (Number(page) - 1) * Number(limit);

		const [messages, total] = await Promise.all([
			Message.find({ conversationId })
				.populate("senderId", "firstName lastName role")
				.populate("receiverId", "firstName lastName role")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit)),
			Message.countDocuments({ conversationId }),
		]);

		// Mark messages as read for this user
		await Message.updateMany(
			{
				conversationId,
				receiverId: currentUserId,
				status: { $ne: "read" },
			},
			{
				$set: { status: "read", readAt: new Date() },
			}
		);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Conversation retrieved successfully",
			data: {
				messages: messages.reverse(),
				pagination: {
					currentPage: Number(page),
					totalPages: Math.ceil(total / Number(limit)),
					total,
					limit: Number(limit),
				},
			},
		});
	}
);

// Get all conversations for a user
export const getAllConversations = asyncHandler(
	async (req: Request, res: Response) => {
		const currentUserId = req.user?.id;
		if (!currentUserId) {
			throw new ApiError("Unauthorized", 401);
		}

		// Get unique conversation IDs
		const messages = await Message.find({
			$or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
		})
			.populate("senderId", "firstName lastName role")
			.populate("receiverId", "firstName lastName role")
			.sort({ createdAt: -1 });

		// Group by conversation
		const conversationMap = new Map();

		for (const message of messages) {
			const conversationId = message.conversationId;

			if (!conversationMap.has(conversationId)) {
				const otherUser =
					message.senderId._id.toString() === currentUserId
						? message.receiverId
						: message.senderId;

				// Count unread messages
				const unreadCount = await Message.countDocuments({
					conversationId,
					receiverId: currentUserId,
					status: { $ne: "read" },
				});

				conversationMap.set(conversationId, {
					conversationId,
					otherUser,
					lastMessage: message,
					unreadCount,
				});
			}
		}

		const conversations = Array.from(conversationMap.values());

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Conversations retrieved successfully",
			data: conversations,
		});
	}
);

// Mark message as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
	const { messageId } = req.params;

	const message = await Message.findById(messageId);
	if (!message) {
		throw new ApiError("Message not found", 404);
	}

	if (message.receiverId.toString() !== req.user?.id) {
		throw new ApiError("Unauthorized", 403);
	}

	message.status = "read";
	message.readAt = new Date();
	await message.save();

	try {
		const io = getIO();
		io.to(message.senderId.toString()).emit("message:read", {
			messageId: message._id,
			conversationId: message.conversationId,
		});
	} catch (error) {
		// Ignore socket errors
	}

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Message marked as read",
		data: message,
	});
});

// Delete a message
export const deleteMessage = asyncHandler(
	async (req: Request, res: Response) => {
		const { messageId } = req.params;

		const message = await Message.findById(messageId);
		if (!message) {
			throw new ApiError("Message not found", 404);
		}

		// Only sender can delete their message
		if (message.senderId.toString() !== req.user?.id) {
			throw new ApiError("Unauthorized to delete this message", 403);
		}

		await Message.findByIdAndDelete(messageId);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Message deleted successfully",
		});
	}
);
