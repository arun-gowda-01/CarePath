import { Request, Response } from "express";
import Medication from "../models/Medication.js";
import Patient from "../models/Patient.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

/**
 * @desc    Get all medications for a patient
 * @route   GET /api/medications/patient/:patientId
 * @access  Private (Doctor/Admin)
 */
export const getPatientMedications = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;

		// Verify patient exists
		const patient = await Patient.findById(patientId);
		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		const medications = await Medication.find({ patientId })
			.populate("patientId", "userId")
			.populate("prescribedBy", "userId")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: medications,
			count: medications.length,
		});
	}
);

/**
 * @desc    Get single medication by ID
 * @route   GET /api/medications/:id
 * @access  Private (Doctor/Admin)
 */
export const getMedicationById = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		const medication = await Medication.findById(id)
			.populate("patientId", "userId")
			.populate("prescribedBy", "userId");

		if (!medication) {
			throw new ApiError("Medication not found", 404);
		}

		res.status(200).json({
			success: true,
			data: medication,
		});
	}
);

/**
 * @desc    Create new medication
 * @route   POST /api/medications
 * @access  Private (Doctor/Admin)
 */
export const createMedication = asyncHandler(
	async (req: Request, res: Response) => {
		const {
			patientId,
			name,
			timings,
			foodRelation,
			startDate,
			endDate,
			instructions,
			sideEffects,
			isActive,
		} = req.body;

		// Verify patient exists
		const patient = await Patient.findById(patientId);
		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		// Validate required fields
		if (
			!name ||
			!timings ||
			!Array.isArray(timings) ||
			timings.length === 0 ||
			!startDate
		) {
			throw new ApiError(
				"Please provide name, timings array, and startDate",
				400
			);
		}

		// Validate timings
		const validTimings = ["morning", "afternoon", "night"];
		for (const timing of timings) {
			if (!timing.timeOfDay || !validTimings.includes(timing.timeOfDay)) {
				throw new ApiError(
					"Each timing must have a valid timeOfDay (morning, afternoon, or night)",
					400
				);
			}
		}

		// Create medication with prescribedBy set to current user (doctor)
		const medication = await Medication.create({
			patientId,
			name,
			timings,
			foodRelation: foodRelation || "after",
			startDate,
			endDate,
			instructions,
			sideEffects,
			adherenceRate: 0,
			isActive: isActive !== undefined ? isActive : true,
			prescribedBy: req.user?.id, // From auth middleware
		});

		if (!medication) {
			throw new ApiError("Error creating medication", 500);
		}

		const populatedMedication = await Medication.findById(medication._id)
			.populate("patientId", "userId")
			.populate("prescribedBy", "userId");

		res.status(201).json({
			success: true,
			data: populatedMedication,
			message: "Medication created successfully",
		});
	}
);

/**
 * @desc    Update medication
 * @route   PUT /api/medications/:id
 * @access  Private (Doctor/Admin)
 */
export const updateMedication = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const {
			name,
			timings,
			foodRelation,
			startDate,
			endDate,
			instructions,
			sideEffects,
			adherenceRate,
			isActive,
		} = req.body;

		const medication = await Medication.findById(id);

		if (!medication) {
			throw new ApiError("Medication not found", 404);
		}

		// Update fields if provided
		if (name !== undefined) medication.name = name;
		if (timings !== undefined) {
			// Validate timings
			const validTimings = ["morning", "afternoon", "night"];
			for (const timing of timings) {
				if (
					!timing.timeOfDay ||
					!validTimings.includes(timing.timeOfDay)
				) {
					throw new ApiError(
						"Each timing must have a valid timeOfDay (morning, afternoon, or night)",
						400
					);
				}
			}
			medication.timings = timings;
		}
		if (foodRelation !== undefined) medication.foodRelation = foodRelation;
		if (startDate !== undefined) medication.startDate = startDate;
		if (endDate !== undefined) medication.endDate = endDate;
		if (instructions !== undefined) medication.instructions = instructions;
		if (sideEffects !== undefined) medication.sideEffects = sideEffects;
		if (adherenceRate !== undefined)
			medication.adherenceRate = adherenceRate;
		if (isActive !== undefined) medication.isActive = isActive;

		await medication.save();

		const updatedMedication = await Medication.findById(id)
			.populate("patientId", "userId")
			.populate("prescribedBy", "userId");

		res.status(200).json({
			success: true,
			data: updatedMedication,
			message: "Medication updated successfully",
		});
	}
);

/**
 * @desc    Delete medication
 * @route   DELETE /api/medications/:id
 * @access  Private (Doctor/Admin)
 */
export const deleteMedication = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		const medication = await Medication.findById(id);

		if (!medication) {
			throw new ApiError("Medication not found", 404);
		}

		await medication.deleteOne();

		res.status(200).json({
			success: true,
			message: "Medication deleted successfully",
		});
	}
);

/**
 * @desc    Update medication adherence rate
 * @route   PATCH /api/medications/:id/adherence
 * @access  Private (Doctor/Admin)
 */
export const updateAdherenceRate = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const { adherenceRate } = req.body;

		if (
			adherenceRate === undefined ||
			adherenceRate < 0 ||
			adherenceRate > 100
		) {
			throw new ApiError("Adherence rate must be between 0 and 100", 400);
		}

		const medication = await Medication.findById(id);

		if (!medication) {
			throw new ApiError("Medication not found", 404);
		}

		medication.adherenceRate = adherenceRate;
		await medication.save();

		const updatedMedication = await Medication.findById(id)
			.populate("patientId", "userId")
			.populate("prescribedBy", "userId");

		res.status(200).json({
			success: true,
			data: updatedMedication,
			message: "Adherence rate updated successfully",
		});
	}
);

/**
 * @desc    Get medications for logged-in patient
 * @route   GET /api/patient/medications
 * @access  Private (Patient)
 */
export const getMyMedications = asyncHandler(
	async (req: Request, res: Response) => {
		// Get patient by userId (from auth middleware)
		const userId = req.user?.id;
		const patient = await Patient.findOne({ userId });

		if (!patient) {
			throw new ApiError("Patient profile not found", 404);
		}

		const medications = await Medication.find({
			patientId: patient._id,
			isActive: true,
		})
			.populate("prescribedBy", "userId")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: medications,
			count: medications.length,
		});
	}
);

/**
 * @desc    Mark a medication dose as taken
 * @route   POST /api/patient/medications/:id/take-dose
 * @access  Private (Patient)
 */
export const markDoseAsTaken = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const { timeOfDay } = req.body;

		// Validate timeOfDay
		if (
			!timeOfDay ||
			!["morning", "afternoon", "night"].includes(timeOfDay)
		) {
			throw new ApiError(
				"Valid timeOfDay is required (morning, afternoon, or night)",
				400
			);
		}

		// Get patient by userId
		const userId = req.user?.id;
		const patient = await Patient.findOne({ userId });

		if (!patient) {
			throw new ApiError("Patient profile not found", 404);
		}

		const medication = await Medication.findById(id);

		if (!medication) {
			throw new ApiError("Medication not found", 404);
		}

		// Verify this medication belongs to the patient
		if (
			medication.patientId.toString() !==
			(patient._id as string).toString()
		) {
			throw new ApiError("Unauthorized access to this medication", 403);
		}

		// Add dose taken record
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		medication.dosesTaken.push({
			date: today,
			timeOfDay: timeOfDay as "morning" | "afternoon" | "night",
			takenAt: new Date(),
		});

		await medication.save();

		res.status(200).json({
			success: true,
			data: medication,
			message: "Dose marked as taken successfully",
		});
	}
);
