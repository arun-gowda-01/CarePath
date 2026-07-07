import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import mongoose from "mongoose";
import { getIO } from "../socket.js";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import VideoCall from "../models/VideoCall.js";

// Simple in-memory store for video call sessions (use Redis in production)
const activeCallSessions = new Map<
	string,
	{
		roomId: string;
		participants: string[];
		startedAt: Date;
		status: "waiting" | "active" | "ended";
	}
>();

// Create a video call room
export const createCallRoom = asyncHandler(
	async (req: Request, res: Response) => {
		const { participantId } = req.body;

		validateRequest([
			{
				field: "participantId",
				value: participantId,
				rules: { required: true, type: "string" },
			},
		]);

		const userId = req.user?.id;
		if (!userId) {
			throw new ApiError("Unauthorized", 401);
		}

		if (req.user?.role !== "doctor") {
			throw new ApiError("Only doctors can initiate video calls", 403);
		}

		const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
		const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
		const LIVEKIT_URL = process.env.LIVEKIT_URL;

		if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
			throw new ApiError("Video calling is not configured", 500);
		}

		// Use a deterministic room name so frontend URLs stay in sync
		const roomId = `room-${userId}-${participantId}-${Date.now()}`;

		// Initialize LiveKit RoomService client
		const roomService = new RoomServiceClient(
			LIVEKIT_URL,
			LIVEKIT_API_KEY,
			LIVEKIT_API_SECRET
		);

		try {
			// Create room in LiveKit (idempotent if room already exists)
			await roomService.createRoom({
				name: roomId,
				emptyTimeout: 5 * 60, // seconds before room is auto-deleted when empty
				maxParticipants: 2,
			});
		} catch (error) {
			// If room already exists or any non-fatal error, we proceed; otherwise, surface configuration issue
			// eslint-disable-next-line no-console
			console.error("Failed to create LiveKit room", error);
		}

		// Create call session in memory for authorization & status tracking
		activeCallSessions.set(roomId, {
			roomId,
			participants: [userId, participantId],
			startedAt: new Date(),
			status: "waiting",
		});

		// Generate LiveKit access token for the doctor (caller)
		const doctorToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
			identity: userId.toString(),
			name: req.user?.name,
		});
		doctorToken.addGrant({
			roomJoin: true,
			room: roomId,
			canPublish: true,
			canSubscribe: true,
		});
		const doctorJwt = await doctorToken.toJwt();

		try {
			const io = getIO();
			io.to(participantId.toString()).emit("video:incoming", {
				roomId,
				fromUserId: userId,
				fromName: req.user?.name,
			});
		} catch (error) {
			// Socket server might not be initialized; ignore errors here
		}

		return res.sendResponse({
			statusCode: 201,
			success: true,
			message: "Video call room created successfully",
			data: {
				roomId,
				participants: [userId, participantId],
				// LiveKit connection details for the caller (doctor)
				token: doctorJwt,
				serverUrl: LIVEKIT_URL,
			},
		});
	}
);

// Join a video call room
export const joinCallRoom = asyncHandler(
	async (req: Request, res: Response) => {
		const { roomId } = req.params;

		const session = activeCallSessions.get(roomId);
		if (!session) {
			throw new ApiError("Call room not found or expired", 404);
		}

		const userId = req.user?.id;
		if (!userId) {
			throw new ApiError("Unauthorized", 401);
		}

		// Check if user is a participant
		if (!session.participants.includes(userId)) {
			throw new ApiError("Not authorized to join this call", 403);
		}

		const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
		const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
		const LIVEKIT_URL = process.env.LIVEKIT_URL;

		if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
			throw new ApiError("Video calling is not configured", 500);
		}

		// Update status to active
		session.status = "active";

		// Generate LiveKit access token for the joining user
		const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
			identity: userId.toString(),
			name: req.user?.name,
		});
		token.addGrant({
			roomJoin: true,
			room: roomId,
			canPublish: true,
			canSubscribe: true,
		});
		const jwt = await token.toJwt();

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Joined video call room successfully",
			data: {
				roomId: session.roomId,
				participants: session.participants,
				status: session.status,
				// LiveKit connection details
				token: jwt,
				serverUrl: LIVEKIT_URL,
			},
		});
	}
);

// End video call
export const endCall = asyncHandler(async (req: Request, res: Response) => {
	const { roomId } = req.params;

	const session = activeCallSessions.get(roomId);
	if (!session) {
		throw new ApiError("Call room not found", 404);
	}

	const userId = req.user?.id;
	if (!userId || !session.participants.includes(userId)) {
		throw new ApiError("Unauthorized to end this call", 403);
	}

	const previousStatus = session.status;

	// Mark as ended
	session.status = "ended";

	try {
		const io = getIO();
		for (const participantId of session.participants) {
			io.to(participantId.toString()).emit("video:ended", {
				roomId,
			});
		}
	} catch (error) {
		// Ignore socket errors
	}

	// Persist video consultation history (non-blocking for the main flow)
	try {
		const participantObjectIds = session.participants.map(
				(id) => new mongoose.Types.ObjectId(id)
			);

		const [doctor, patient] = await Promise.all([
			Doctor.findOne({ userId: { $in: participantObjectIds } }),
			Patient.findOne({ userId: { $in: participantObjectIds } }),
		]);

		if (doctor && patient) {
			const startTime = session.startedAt;
			const endTime = new Date();
			const durationSeconds = Math.floor(
				(endTime.getTime() - startTime.getTime()) / 1000
			);

			await VideoCall.create({
				patientId: patient._id,
				DoctorId: doctor._id,
				startTime,
				endTime,
				// duration stored in seconds for easier reporting
				duration: durationSeconds,
				status: previousStatus === "active" ? "completed" : "cancelled",
				callType: "video",
			});
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Failed to save video consultation record", error);
	}

	// Remove from active sessions after 5 minutes
	setTimeout(() => {
		activeCallSessions.delete(roomId);
	}, 5 * 60 * 1000);

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Video call ended successfully",
		data: {
			roomId,
			duration: Date.now() - session.startedAt.getTime(),
		},
	});
});

// Get call session details
export const getCallSession = asyncHandler(
	async (req: Request, res: Response) => {
		const { roomId } = req.params;

		const session = activeCallSessions.get(roomId);
		if (!session) {
			throw new ApiError("Call room not found", 404);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Call session retrieved successfully",
			data: session,
		});
	}
);

// Get video consultation history for a patient for the logged-in doctor
export const getConsultationsForPatient = asyncHandler(
	async (req: Request, res: Response) => {
		const doctorUserId = req.user?.id;
		const { patientId } = req.params;

		if (!doctorUserId) {
			throw new ApiError("Unauthorized", 401);
		}

		if (!mongoose.Types.ObjectId.isValid(patientId)) {
			throw new ApiError("Invalid patient ID", 400);
		}

		const [doctor, patient] = await Promise.all([
			Doctor.findOne({ userId: doctorUserId }),
			Patient.findById(patientId),
		]);

		if (!doctor || !patient) {
			throw new ApiError("Doctor or patient not found", 404);
		}

		const consultations = await VideoCall.find({
			patientId: patient._id,
			DoctorId: doctor._id,
		})
			.sort({ startTime: -1 })
			.limit(50);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Video consultations retrieved successfully",
			data: {
				consultations,
			},
		});
	}
);

// WebRTC Signaling endpoints (for peer connection)
export const sendSignal = asyncHandler(async (req: Request, res: Response) => {
	const { roomId, signal, targetUserId } = req.body;

	validateRequest([
		{
			field: "roomId",
			value: roomId,
			rules: { required: true, type: "string" },
		},
		{
			field: "signal",
			value: signal,
			rules: { required: true, type: "object" },
		},
		{
			field: "targetUserId",
			value: targetUserId,
			rules: { required: true, type: "string" },
		},
	]);

	// In a real application, this would use WebSocket/Socket.IO
	// For now, just acknowledge the signal
	// TODO: Implement real-time signaling with Socket.IO

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Signal sent successfully",
		data: {
			roomId,
			from: req.user?.id,
			to: targetUserId,
		},
	});
});
