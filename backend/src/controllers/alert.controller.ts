import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import Alert from "../models/Alert.js";
import Patient from "../models/Patient.js";
import mongoose from "mongoose";

// Get all alerts (with filters)
export const getAllAlerts = asyncHandler(
	async (req: Request, res: Response) => {
		const {
			patientId,
			status,
			severity,
			type,
			page = 1,
			limit = 20,
			includeViewed = "false",
		} = req.query;

		const query: any = {};

		if (patientId) query.patientId = patientId;
		if (status) query.status = status;
		if (severity) query.severity = severity;
		if (type) query.type = type;

		// Filter out viewed alerts for current user unless includeViewed is true
		if (includeViewed === "false" && req.user?.id) {
			query.viewedBy = { $ne: new mongoose.Types.ObjectId(req.user.id) };
		}

		const skip = (Number(page) - 1) * Number(limit);

		const [alerts, total] = await Promise.all([
			Alert.find(query)
				.populate(
					"patientId",
					"userId procedure procedureDate riskLevel"
				)
				.populate({
					path: "patientId",
					populate: {
						path: "userId",
						select: "firstName lastName email",
					},
				})
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit)),
			Alert.countDocuments(query),
		]);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Alerts retrieved successfully",
			data: {
				alerts,
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

// Get alert by ID
export const getAlertById = asyncHandler(
	async (req: Request, res: Response) => {
		const { alertId } = req.params;

		const alert = await Alert.findById(alertId)
			.populate("patientId", "userId procedure procedureDate")
			.populate({
				path: "patientId",
				populate: {
					path: "userId",
					select: "firstName lastName email",
				},
			});

		if (!alert) {
			throw new ApiError("Alert not found", 404);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Alert retrieved successfully",
			data: alert,
		});
	}
);

// Create a manual alert
export const createAlert = asyncHandler(async (req: Request, res: Response) => {
	const { patientId, type, severity, message, assignedTo } = req.body;

	validateRequest([
		{
			field: "patientId",
			value: patientId,
			rules: { required: true, type: "string" },
		},
		{
			field: "type",
			value: type,
			rules: {
				required: true,
				enum: [
					"High Fever",
					"Severe Pain",
					"Missed Medication",
					"Low Adherence",
					"Abnormal Vitals",
					"Wound Concern",
					"Check-in Completed",
					"Other",
				],
			},
		},
		{
			field: "severity",
			value: severity,
			rules: {
				required: true,
				enum: ["normal", "warning", "critical"],
			},
		},
		{
			field: "message",
			value: message,
			rules: { required: true, type: "string", minLength: 1 },
		},
	]);

	const patient = await Patient.findById(patientId);
	if (!patient) {
		throw new ApiError("Patient not found", 404);
	}

	const alert = await Alert.create({
		patientId,
		type,
		severity,
		message,
		assignedTo,
		triggeredBy: {
			source: "manual",
		},
	});

	return res.sendResponse({
		statusCode: 201,
		success: true,
		message: "Alert created successfully",
		data: alert,
	});
});

// Update alert status
export const updateAlertStatus = asyncHandler(
	async (req: Request, res: Response) => {
		const { alertId } = req.params;
		const { status, action, notes } = req.body;

		validateRequest([
			{
				field: "status",
				value: status,
				rules: { enum: ["active", "resolved", "dismissed"] },
			},
		]);

		const alert = await Alert.findById(alertId);
		if (!alert) {
			throw new ApiError("Alert not found", 404);
		}

		if (status) {
			alert.status = status;

			if (status === "resolved") {
				alert.resolvedBy = new mongoose.Types.ObjectId(req.user?.id);
				alert.resolvedAt = new Date();
			}
		}

		if (action) {
			alert.actions = alert.actions || [];
			alert.actions.push({
				action,
				performedBy: new mongoose.Types.ObjectId(req.user?.id),
				performedAt: new Date(),
				notes,
			});
		}

		await alert.save();

		const updatedAlert = await Alert.findById(alertId).populate(
			"patientId",
			"userId procedure"
		);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Alert updated successfully",
			data: updatedAlert,
		});
	}
);

// Delete alert
export const deleteAlert = asyncHandler(async (req: Request, res: Response) => {
	const { alertId } = req.params;

	const alert = await Alert.findByIdAndDelete(alertId);
	if (!alert) {
		throw new ApiError("Alert not found", 404);
	}

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Alert deleted successfully",
	});
});

// Get alert statistics
export const getAlertStats = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.query;

		const query: any = patientId ? { patientId } : {};

		const [
			totalAlerts,
			activeAlerts,
			criticalAlerts,
			warningAlerts,
			resolvedAlerts,
		] = await Promise.all([
			Alert.countDocuments(query),
			Alert.countDocuments({ ...query, status: "active" }),
			Alert.countDocuments({ ...query, severity: "critical" }),
			Alert.countDocuments({ ...query, severity: "warning" }),
			Alert.countDocuments({ ...query, status: "resolved" }),
		]);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Alert statistics retrieved successfully",
			data: {
				totalAlerts,
				activeAlerts,
				criticalAlerts,
				warningAlerts,
				resolvedAlerts,
				dismissedAlerts: totalAlerts - activeAlerts - resolvedAlerts,
			},
		});
	}
);

// Mark alert as viewed
export const markAlertAsViewed = asyncHandler(
	async (req: Request, res: Response) => {
		const { alertId } = req.params;

		const alert = await Alert.findById(alertId);
		if (!alert) {
			throw new ApiError("Alert not found", 404);
		}

		const userId = new mongoose.Types.ObjectId(req.user?.id);

		// Add user to viewedBy array if not already present
		if (!alert.viewedBy) {
			alert.viewedBy = [];
		}

		const alreadyViewed = alert.viewedBy.some(
			(id) => id.toString() === userId.toString()
		);

		if (!alreadyViewed) {
			alert.viewedBy.push(userId);
			await alert.save();
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Alert marked as viewed",
			data: alert,
		});
	}
);
