import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import FollowUpConsultation from "../models/FollowUpConsultation.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Assignment from "../models/Assignment.js";

// Create a new follow-up consultation
export const createFollowUpConsultation = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId, title, description, scheduledTime, priority, location } =
			req.body;

		validateRequest([
			{
				field: "patientId",
				value: patientId,
				rules: { required: true, type: "string" },
			},
			{
				field: "title",
				value: title,
				rules: { required: true, type: "string", minLength: 1 },
			},
			{
				field: "scheduledTime",
				value: scheduledTime,
				rules: { required: true, type: "date" },
			},
		]);

		const patient = await Patient.findById(patientId);
		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		// Get doctor ID from authenticated user
		const userId = req.user?.id;
		if (!userId) {
			throw new ApiError("Unauthorized", 401);
		}

		const doctor = await Doctor.findOne({ userId });
		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		// Verify doctor has access to this patient
		const assignment = await Assignment.findOne({
			doctorId: doctor._id,
			patientId,
			status: { $ne: "inactive" },
		});

		if (!assignment) {
			throw new ApiError(
				"You do not have access to this patient",
				403
			);
		}

		const followUp = await FollowUpConsultation.create({
			patientId,
			doctorId: doctor._id,
			title,
			description,
			scheduledTime: new Date(scheduledTime),
			priority: priority || "medium",
			location,
			status: "scheduled",
		});

		const populatedFollowUp = await FollowUpConsultation.findById(
			followUp._id
		)
			.populate("patientId", "procedure procedureDate")
			.populate("doctorId", "userId")
			.populate("doctorId.userId", "firstName lastName");

		return res.sendResponse({
			statusCode: 201,
			success: true,
			message: "Follow-up consultation created successfully",
			data: populatedFollowUp,
		});
	}
);

// Get all follow-up consultations for a patient
export const getPatientFollowUpConsultations = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { status } = req.query;

		const query: any = { patientId };

		if (status) {
			query.status = status;
		}

		const followUps = await FollowUpConsultation.find(query)
			.populate("doctorId", "userId")
			.populate("doctorId.userId", "firstName lastName")
			.sort({ scheduledTime: 1 });

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Follow-up consultations retrieved successfully",
			data: followUps,
		});
	}
);

// Get a single follow-up consultation
export const getFollowUpConsultationById = asyncHandler(
	async (req: Request, res: Response) => {
		const { followUpId } = req.params;

		const followUp = await FollowUpConsultation.findById(followUpId)
			.populate("patientId", "procedure procedureDate")
			.populate("doctorId", "userId")
			.populate("doctorId.userId", "firstName lastName");

		if (!followUp) {
			throw new ApiError("Follow-up consultation not found", 404);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Follow-up consultation retrieved successfully",
			data: followUp,
		});
	}
);

// Update a follow-up consultation
export const updateFollowUpConsultation = asyncHandler(
	async (req: Request, res: Response) => {
		const { followUpId } = req.params;
		const { title, description, scheduledTime, priority, location, status, notes } =
			req.body;

		const followUp = await FollowUpConsultation.findById(followUpId);
		if (!followUp) {
			throw new ApiError("Follow-up consultation not found", 404);
		}

		// Get doctor ID from authenticated user
		const userId = req.user?.id;
		if (!userId) {
			throw new ApiError("Unauthorized", 401);
		}

		const doctor = await Doctor.findOne({ userId });
		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		// Check if the user is the doctor who created it
		if (followUp.doctorId.toString() !== doctor._id.toString()) {
			throw new ApiError(
				"Unauthorized to update this follow-up consultation",
				403
			);
		}

		if (title !== undefined) followUp.title = title;
		if (description !== undefined) followUp.description = description;
		if (scheduledTime !== undefined)
			followUp.scheduledTime = new Date(scheduledTime);
		if (priority !== undefined) followUp.priority = priority;
		if (location !== undefined) followUp.location = location;
		if (status !== undefined) {
			followUp.status = status;
			if (status === "completed" && !followUp.completedAt) {
				followUp.completedAt = new Date();
			}
		}
		if (notes !== undefined) followUp.notes = notes;

		await followUp.save();

		const updatedFollowUp = await FollowUpConsultation.findById(followUpId)
			.populate("patientId", "procedure procedureDate")
			.populate("doctorId", "userId")
			.populate("doctorId.userId", "firstName lastName");

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Follow-up consultation updated successfully",
			data: updatedFollowUp,
		});
	}
);

// Delete a follow-up consultation
export const deleteFollowUpConsultation = asyncHandler(
	async (req: Request, res: Response) => {
		const { followUpId } = req.params;

		const followUp = await FollowUpConsultation.findById(followUpId);
		if (!followUp) {
			throw new ApiError("Follow-up consultation not found", 404);
		}

		// Get doctor ID from authenticated user
		const userId = req.user?.id;
		if (!userId) {
			throw new ApiError("Unauthorized", 401);
		}

		const doctor = await Doctor.findOne({ userId });
		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		// Check if the user is the doctor who created it
		if (
			followUp.doctorId.toString() !== doctor._id.toString() &&
			req.user?.role !== "admin"
		) {
			throw new ApiError(
				"Unauthorized to delete this follow-up consultation",
				403
			);
		}

		await FollowUpConsultation.findByIdAndDelete(followUpId);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Follow-up consultation deleted successfully",
		});
	}
);

