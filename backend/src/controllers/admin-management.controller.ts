import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import User from "../models/User.js";

export const addAdmin = asyncHandler(
	async (req: Request, res: Response) => {
		const {
			email,
			firstName,
			lastName,
			password,
		} = req.body;

		if (
			!email ||
			!firstName ||
			!lastName ||
			!password
		) {
			throw new ApiError(
				"email, firstName, lastName, and password are required",
				400
			);
		}

		if (password.length < 6) {
			throw new ApiError(
				"Password must be at least 6 characters",
				400
			);
		}

		const normalizedEmail =
			email.toLowerCase().trim();

		const existingUser =
			await User.findOne({
				email: normalizedEmail,
			});

		if (existingUser) {
			throw new ApiError(
				"User with this email already exists",
				409
			);
		}

		const admin =
			await User.create({
				email: normalizedEmail,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				password,
				role: "admin",
			});

		return res.sendResponse({
			statusCode: 201,
			success: true,
			message:
				"Admin created successfully",
			data: {
				id: admin._id,
				email: admin.email,
				firstName:
					admin.firstName,
				lastName:
					admin.lastName,
				role: admin.role,
			},
		});
	}
);