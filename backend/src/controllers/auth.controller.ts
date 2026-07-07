import { Response, Request } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { validateRequest } from "../utils/validation.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
	const { email, password, role } = req.body;

	validateRequest([
		{
			field: "email",
			value: email,
			rules: { required: true, type: "email" },
		},
		{
			field: "password",
			value: password,
			rules: { required: true, type: "string", minLength: 6 },
		},
		{
			field: "role",
			value: role,
			rules: { required: true, enum: ["admin", "doctor", "patient"] },
		},
	]);

	const user = await User.findOne({ email, role }).select("+password");

	if (!user) {
		throw new ApiError("Invalid email or role", 400);
	}

	const isPasswordValid = await user.comparePassword(password);
	if (!isPasswordValid) {
		throw new ApiError("Invalid password", 400);
	}

	user.lastLogin = new Date();
	await user.save();

	const token = jwt.sign(
		{
			id: user._id,
			email: user.email,
			role: user.role,
			name: user.fullName,
		},
		process.env.JWT_SECRET!,
		{ expiresIn: "7d" }
	);

	const isProduction = process.env.NODE_ENV === "production";

	res.cookie("authToken", token, {
		httpOnly: true,
		secure: isProduction, // false in development
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		sameSite: isProduction ? "none" : "lax", // "lax" in development
		path: "/",
	});

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Login successful",
		data: {
			id: user._id,
			email: user.email,
			role: user.role,
			name: user.fullName,
		},
	});
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
	const isProduction = process.env.NODE_ENV === "production";

	res.clearCookie("authToken", {
		httpOnly: true,
		secure: isProduction, // Must match login
		sameSite: isProduction ? "none" : "lax", // Must match login
		path: "/",
	});

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Logout successful",
	});
});

export const getCurrentUser = asyncHandler(
	async (req: Request, res: Response) => {
		const user = req.user;
		if (!user) {
			throw new ApiError("User not authenticated", 401);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Current user fetched successfully",
			data: {
				id: user.id,
				email: user.email,
				role: user.role,
				name: user.name,
			},
		});
	}
);

export const updateProfile = asyncHandler(
	async (req: Request, res: Response) => {
		const userId = req.user?.id;
		if (!userId) {
			throw new ApiError("User not authenticated", 401);
		}

		const { firstName, lastName, email, currentPassword, newPassword } =
			req.body;

		// Get user with password to verify current password if changing password
		const user = await User.findById(userId).select("+password");
		if (!user) {
			throw new ApiError("User not found", 404);
		}

		// If changing password, verify current password
		if (newPassword) {
			if (!currentPassword) {
				throw new ApiError(
					"Current password is required to change password",
					400
				);
			}
			const isPasswordValid = await user.comparePassword(currentPassword);
			if (!isPasswordValid) {
				throw new ApiError("Current password is incorrect", 400);
			}
			user.password = newPassword; // Will be hashed by pre-save hook
		}

		// Update email if provided
		if (email !== undefined) {
			// Check if email is already taken by another user
			const existingUser = await User.findOne({
				email,
				_id: { $ne: userId },
			});
			if (existingUser) {
				throw new ApiError("Email is already taken", 400);
			}
			user.email = email;
		}

		// Update name if provided
		if (firstName !== undefined) {
			user.firstName = firstName;
		}
		if (lastName !== undefined) {
			user.lastName = lastName;
		}

		await user.save();

		// Return updated user without password
		const updatedUser = await User.findById(userId);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Profile updated successfully",
			data: {
				id: updatedUser!._id,
				email: updatedUser!.email,
				role: updatedUser!.role,
				name: updatedUser!.fullName,
			},
		});
	}
);
