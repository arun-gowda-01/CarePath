import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import SymptomCheckIn from "../models/SymptomCheckIn.js";
import Patient from "../models/Patient.js";
import Alert from "../models/Alert.js";
import Assignment from "../models/Assignment.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";

// Submit daily health update
export const submitSymptomCheckIn = asyncHandler(
	async (req: Request, res: Response) => {
		const {
			userId,
			painLevel,
			temperature,
			bloodPressure,
			mood,
			notes,
			symptoms,
		} = req.body;

		console.log({
			userId,
			painLevel,
			temperature,
			bloodPressure,
			mood,
			notes,
			symptoms,
		});

		validateRequest([
			{
				field: "userId",
				value: userId,
				rules: { required: true, type: "string" },
			},
			{
				field: "painLevel",
				value: Number(painLevel),
				rules: { required: true, type: "number", min: 0, max: 10 },
			},
			{
				field: "temperature",
				value: Number(temperature),
				rules: { required: true, type: "number" },
			},
			{
				field: "mood",
				value: mood,
				rules: {
					required: true,
					enum: ["poor", "okay", "good", "excellent"],
				},
			},
		]);

		const patient = await Patient.findOne({ userId });
		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		// Check for once-per-day and 8-hour gap validation
		const now = new Date();
		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate()
		);
		const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);

		const lastCheckIn = await SymptomCheckIn.findOne({
			patientId: patient._id,
		})
			.sort({ checkInDate: -1 })
			.limit(1);

		if (lastCheckIn) {
			const lastCheckInDate = new Date(lastCheckIn.checkInDate);

			// Check if last check-in was today (same calendar day)
			const lastCheckInStart = new Date(
				lastCheckInDate.getFullYear(),
				lastCheckInDate.getMonth(),
				lastCheckInDate.getDate()
			);

			if (lastCheckInStart.getTime() === todayStart.getTime()) {
				throw new ApiError(
					"You have already submitted a check-in today. Only one check-in per day is allowed.",
					400
				);
			}

			// Check 8-hour gap
			if (lastCheckInDate > eightHoursAgo) {
				const hoursRemaining = Math.ceil(
					(lastCheckInDate.getTime() +
						8 * 60 * 60 * 1000 -
						now.getTime()) /
						(60 * 60 * 1000)
				);
				throw new ApiError(
					`Please wait ${hoursRemaining} hour(s) before submitting another check-in. Minimum 8-hour gap required.`,
					400
				);
			}
		}

		// Handle image upload to Cloudinary if file exists
		let imageData = undefined;
		if (req.file) {
			const uploadResult = await uploadToCloudinary(
				req.file.path,
				`carepath/check-ins/${patient._id}`
			);

			if (uploadResult) {
				imageData = {
					url: uploadResult.url,
					filename: uploadResult.filename,
					uploadedAt: new Date(),
				};
			}
		}

		const checkIn = await SymptomCheckIn.create({
			patientId: patient._id,
			painLevel: Number(painLevel),
			temperature: Number(temperature),
			bloodPressure,
			mood,
			notes,
			symptoms,
			image: imageData,
			checkInDate: new Date(),
		});

		// Create basic completion alert
		await Alert.create({
			patientId: patient._id,
			type: "Check-in Completed",
			severity: "normal",
			message: "Daily check-in completed successfully",
			triggeredBy: {
				source: "symptom-checkin",
				referenceId: checkIn._id,
			},
		});

		return res.sendResponse({
			statusCode: 201,
			success: true,
			message: "Symptom check-in submitted successfully",
			data: {
				checkIn,
			},
		});
	}
);

// Update patient monitoring duration (in days) by doctor
export const updatePatientMonitoringDuration = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { monitoringDays } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			throw new ApiError("Doctor not authenticated", 401);
		}

		const doctor = await Doctor.findOne({ userId: userId });

		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		validateRequest([
			{
				field: "monitoringDays",
				value: monitoringDays,
				rules: {
					required: true,
					type: "number",
					min: 1,
				},
			},
		]);

		// Verify doctor has access to this patient
		const assignment = await Assignment.findOne({
			doctorId: doctor._id,
			patientId,
			status: { $ne: "inactive" },
		});

		if (!assignment) {
			throw new ApiError("You do not have access to this patient", 403);
		}

		const patient = await Patient.findById(patientId);

		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		patient.monitoringDays = Number(monitoringDays);
		await patient.save();

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patient monitoring duration updated successfully",
			data: {
				patientId,
				monitoringDays: patient.monitoringDays,
			},
		});
	}
);

// Get all check-ins for a patient
export const getPatientCheckIns = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;

		const patient = await Patient.findOne({ userId: patientId });

		const checkIns = await SymptomCheckIn.find({
			patientId: patient?._id,
		});

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Check-ins retrieved successfully",
			data: {
				checkIns,
			},
		});
	}
);

// Get recovery trends/analytics
export const getRecoveryTrends = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { days = 30 } = req.query;

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - Number(days));

		const checkIns = await SymptomCheckIn.find({
			patientId,
			checkInDate: { $gte: startDate },
		}).sort({ checkInDate: 1 });

		if (checkIns.length === 0) {
			return res.sendResponse({
				statusCode: 200,
				success: true,
				message: "No check-in data available for analysis",
				data: {
					trends: [],
					summary: {
						totalCheckIns: 0,
						averagePain: 0,
						averageTemp: 0,
						improvementTrend: "insufficient_data",
					},
				},
			});
		}

		// Calculate trends
		const painTrend = checkIns.map((c) => ({
			date: c.checkInDate,
			value: c.painLevel,
		}));

		const tempTrend = checkIns.map((c) => ({
			date: c.checkInDate,
			value: c.temperature,
		}));

		const moodTrend = checkIns.map((c) => ({
			date: c.checkInDate,
			value: c.mood,
		}));

		// Calculate averages
		const avgPain =
			checkIns.reduce((sum, c) => sum + c.painLevel, 0) / checkIns.length;
		const avgTemp =
			checkIns.reduce((sum, c) => sum + c.temperature, 0) /
			checkIns.length;

		// Determine improvement trend
		const recentCheckIns = checkIns.slice(-7); // Last 7 days
		const olderCheckIns = checkIns.slice(0, -7);

		let improvementTrend = "stable";
		if (recentCheckIns.length > 0 && olderCheckIns.length > 0) {
			const recentAvgPain =
				recentCheckIns.reduce((sum, c) => sum + c.painLevel, 0) /
				recentCheckIns.length;
			const olderAvgPain =
				olderCheckIns.reduce((sum, c) => sum + c.painLevel, 0) /
				olderCheckIns.length;

			if (recentAvgPain < olderAvgPain - 1) {
				improvementTrend = "improving";
			} else if (recentAvgPain > olderAvgPain + 1) {
				improvementTrend = "declining";
			}
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Recovery trends retrieved successfully",
			data: {
				trends: {
					pain: painTrend,
					temperature: tempTrend,
					mood: moodTrend,
				},
				summary: {
					totalCheckIns: checkIns.length,
					averagePain: Math.round(avgPain * 10) / 10,
					averageTemp: Math.round(avgTemp * 10) / 10,
					improvementTrend,
				},
			},
		});
	}
);

// Get single check-in by ID
export const getCheckInById = asyncHandler(
	async (req: Request, res: Response) => {
		const { checkInId } = req.params;

		const checkIn = await SymptomCheckIn.findById(checkInId).populate(
			"patientId",
			"userId procedure procedureDate"
		);

		if (!checkIn) {
			throw new ApiError("Check-in not found", 404);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Check-in retrieved successfully",
			data: checkIn,
		});
	}
);

// Get check-ins for doctor's assigned patients
export const getDoctorPatientCheckIns = asyncHandler(
	async (req: Request, res: Response) => {
		const userId = req.user?.id;

		if (!userId) {
			throw new ApiError("Doctor not authenticated", 401);
		}

		const doctor = await Doctor.findOne({ userId: userId });

		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		// Get all patients assigned to this doctor
		const assignments = await Assignment.find({
			doctorId: doctor._id,
			status: { $ne: "inactive" },
		});
		const patientIds = assignments.map((a) => a.patientId);

		if (patientIds.length === 0) {
			return res.sendResponse({
				statusCode: 200,
				success: true,
				message: "No assigned patients found",
				data: { checkIns: [] },
			});
		}

		// Get check-ins for these patients
		const checkIns = await SymptomCheckIn.find({
			patientId: { $in: patientIds },
		})
			.populate("patientId", "userId procedure procedureDate")
			.populate("reviewedBy", "userId")
			.sort({ checkInDate: -1 })
			.limit(100);

		// Separate into read and unread
		const unreadCheckIns = checkIns.filter((c) => !c.isRead);
		const readCheckIns = checkIns.filter((c) => c.isRead);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Check-ins retrieved successfully",
			data: {
				checkIns,
				unreadCheckIns,
				readCheckIns,
				summary: {
					total: checkIns.length,
					unread: unreadCheckIns.length,
					read: readCheckIns.length,
				},
			},
		});
	}
);

// Get check-ins for a specific patient (Doctor access)
export const getDoctorSpecificPatientCheckIns = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			throw new ApiError("Doctor not authenticated", 401);
		}

		const doctor = await Doctor.findOne({ userId: userId });

		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		// Verify doctor has access to this patient
		const assignment = await Assignment.findOne({
			doctorId: doctor._id,
			patientId,
		});

		if (!assignment) {
			throw new ApiError(
				"You do not have access to this patient's check-ins",
				403
			);
		}

		// Get check-ins for this specific patient
		const checkIns = await SymptomCheckIn.find({
			patientId,
		})
			.populate("patientId", "userId procedure procedureDate")
			.populate("reviewedBy", "userId")
			.sort({ checkInDate: -1 });

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Check-ins retrieved successfully",
			data: {
				checkIns,
			},
		});
	}
);

// Get recovery trends for a specific patient (Doctor access)
export const getDoctorPatientRecoveryTrends = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { days = 30 } = req.query;
		const userId = req.user?.id;

		if (!userId) {
			throw new ApiError("Doctor not authenticated", 401);
		}

		const doctor = await Doctor.findOne({ userId: userId });

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
				"You do not have access to this patient's data",
				403
			);
		}

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - Number(days));

		const checkIns = await SymptomCheckIn.find({
			patientId,
			checkInDate: { $gte: startDate },
		}).sort({ checkInDate: 1 });

		if (checkIns.length === 0) {
			return res.sendResponse({
				statusCode: 200,
				success: true,
				message: "No check-in data available for analysis",
				data: {
					trends: [],
					summary: {
						totalCheckIns: 0,
						averagePain: 0,
						averageTemp: 0,
						improvementTrend: "insufficient_data",
					},
				},
			});
		}

		// Calculate trends
		const painTrend = checkIns.map((c) => ({
			date: c.checkInDate,
			value: c.painLevel,
		}));

		const tempTrend = checkIns.map((c) => ({
			date: c.checkInDate,
			value: c.temperature,
		}));

		const moodTrend = checkIns.map((c) => ({
			date: c.checkInDate,
			value: c.mood,
		}));

		// Calculate averages
		const avgPain =
			checkIns.reduce((sum, c) => sum + c.painLevel, 0) / checkIns.length;
		const avgTemp =
			checkIns.reduce((sum, c) => sum + c.temperature, 0) /
			checkIns.length;

		// Determine improvement trend
		const recentCheckIns = checkIns.slice(-7); // Last 7 days
		const olderCheckIns = checkIns.slice(0, -7);

		let improvementTrend = "stable";
		if (recentCheckIns.length > 0 && olderCheckIns.length > 0) {
			const recentAvgPain =
				recentCheckIns.reduce((sum, c) => sum + c.painLevel, 0) /
				recentCheckIns.length;
			const olderAvgPain =
				olderCheckIns.reduce((sum, c) => sum + c.painLevel, 0) /
				olderCheckIns.length;

			if (recentAvgPain < olderAvgPain - 1) {
				improvementTrend = "improving";
			} else if (recentAvgPain > olderAvgPain + 1) {
				improvementTrend = "declining";
			}
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Recovery trends retrieved successfully",
			data: {
				trends: {
					pain: painTrend,
					temperature: tempTrend,
					mood: moodTrend,
				},
				summary: {
					totalCheckIns: checkIns.length,
					averagePain: Math.round(avgPain * 10) / 10,
					averageTemp: Math.round(avgTemp * 10) / 10,
					improvementTrend,
				},
			},
		});
	}
);

// Get single check-in by ID (Doctor access)
export const getDoctorCheckInById = asyncHandler(
	async (req: Request, res: Response) => {
		const { checkInId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			throw new ApiError("Doctor not authenticated", 401);
		}

		const doctor = await Doctor.findOne({ userId: userId });

		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		const checkIn = await SymptomCheckIn.findById(checkInId).populate(
			"patientId",
			"userId procedure procedureDate"
		);

		if (!checkIn) {
			throw new ApiError("Check-in not found", 404);
		}

		// Verify doctor has access to this patient
		const assignment = await Assignment.findOne({
			doctorId: doctor._id,
			patientId: checkIn.patientId,
			status: { $ne: "inactive" },
		});

		if (!assignment) {
			throw new ApiError(
				"You do not have access to this patient's check-ins",
				403
			);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Check-in retrieved successfully",
			data: checkIn,
		});
	}
);

// Mark check-in as reviewed by doctor
export const markCheckInAsReviewed = asyncHandler(
	async (req: Request, res: Response) => {
		const { checkInId } = req.params;
		const userId = req.user?.id;

		if (!userId) {
			throw new ApiError("Doctor not authenticated", 401);
		}

		const doctor = await Doctor.findOne({ userId: userId });

		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		const checkIn = await SymptomCheckIn.findById(checkInId);

		if (!checkIn) {
			throw new ApiError("Check-in not found", 404);
		}

		// Verify doctor has access to this patient
		const assignment = await Assignment.findOne({
			doctorId: doctor._id,
			patientId: checkIn.patientId,
		});

		if (!assignment) {
			throw new ApiError(
				"You do not have access to this patient's check-ins",
				403
			);
		}

		checkIn.isRead = true;
		checkIn.reviewedBy = userId as any;
		checkIn.reviewedAt = new Date();
		await checkIn.save();

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Check-in marked as reviewed",
			data: checkIn,
		});
	}
);

// Update patient risk level by doctor
export const updatePatientRiskLevel = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { riskLevel } = req.body;
		const userId = req.user?.id;

		if (!userId) {
			throw new ApiError("Doctor not authenticated", 401);
		}

		const doctor = await Doctor.findOne({ userId: userId });

		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		validateRequest([
			{
				field: "riskLevel",
				value: riskLevel,
				rules: {
					required: true,
					enum: ["stable", "monitor", "critical"],
				},
			},
		]);

		// Verify doctor has access to this patient
		const assignment = await Assignment.findOne({
			doctorId: doctor._id,
			patientId,
			status: { $ne: "inactive" },
		});

		if (!assignment) {
			throw new ApiError("You do not have access to this patient", 403);
		}

		const patient = await Patient.findById(patientId);

		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		const oldRiskLevel = patient.riskLevel;
		patient.riskLevel = riskLevel;
		await patient.save();

		// Create an alert for risk level change
		await Alert.create({
			patientId,
			type: "Check-in Completed",
			severity:
				riskLevel === "critical"
					? "critical"
					: riskLevel === "monitor"
					? "warning"
					: "normal",
			message: `Risk level updated from ${oldRiskLevel} to ${riskLevel} by doctor`,
			triggeredBy: {
				source: "doctor-review",
				referenceId: userId,
			},
		});

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patient risk level updated successfully",
			data: {
				patientId,
				oldRiskLevel,
				newRiskLevel: riskLevel,
			},
		});
	}
);
