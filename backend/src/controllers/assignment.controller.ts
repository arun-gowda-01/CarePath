import { Request, Response } from "express";
import Assignment from "../models/Assignment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Alert from "../models/Alert.js";

export const assignPatientToDoctor = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId, doctorId, assignedDate } = req.body;

		if (!patientId || !doctorId) {
			throw new ApiError("Patient ID and Doctor ID are required", 400);
		}

		const existingAssignment = await Assignment.findOne({
			patientId,
		});

		if (existingAssignment) {
			throw new ApiError(
				"This patient is already assigned to a doctor",
				400
			);
		}

		const assignment = new Assignment({
			patientId,
			doctorId,
			assignedDate: assignedDate || Date.now(),
		});

		await assignment.save();

		// Fetch patient and doctor details for alert message
		const [patient, doctor] = await Promise.all([
			Patient.findById(patientId).populate(
				"userId",
				"firstName lastName"
			),
			Doctor.findById(doctorId).populate("userId", "firstName lastName"),
		]);

		// Create alert for the doctor about new patient assignment
		if (patient && doctor) {
			const patientName =
				`${(patient.userId as any)?.firstName || ""} ${
					(patient.userId as any)?.lastName || ""
				}`.trim() || "New Patient";

			await Alert.create({
				patientId,
				type: "Other",
				severity: "normal",
				message: `New patient "${patientName}" has been assigned to you`,
				status: "active",
				source: {
					type: "system",
					referenceId: assignment._id.toString(),
				},
				assignedTo: doctorId,
			});
		}

		return res.sendResponse({
			statusCode: 201,
			success: true,
			message: "Patient assigned to doctor successfully",
			data: assignment,
		});
	}
);

export const deleteAssignment = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;

		const assignment = await Assignment.findByIdAndDelete(id);

		if (!assignment) {
			throw new ApiError("Assignment not found", 404);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Assignment deleted successfully",
			data: assignment,
		});
	}
);

export const getAllAssignments = asyncHandler(
	async (req: Request, res: Response) => {
		// Fetch Doctors, Patients, and Assignments
		const [allDoctors, assignments, allPatients] = await Promise.all([
			Doctor.find().populate("userId", "firstName lastName"),
			Assignment.find()
				.populate("doctorId", "userId role")
				.populate("patientId", "userId procedure procedureDate"),
			Patient.find().populate("userId", "firstName lastName"),
		]);

		// Map patients by ID for O(1) lookup
		const patientMap = new Map(
			allPatients.map((p) => [p?._id?.toString(), p])
		);

		// Initialize doctor map
		const doctorPatientMap = new Map();

		allDoctors.forEach((doctor) => {
			doctorPatientMap.set(doctor._id?.toString(), {
				doctor: {
					_id: doctor._id,
					userId: doctor.userId,
					role: doctor.role,
				},
				patients: [],
				patientCount: 0,
			});
		});

		const assignedPatientIds = new Set();

		// Build doctor-patient assignment list
		assignments.forEach((assignment) => {
			const doctorId = assignment.doctorId?._id?.toString();
			const patientId = assignment.patientId?._id?.toString();

			if (!doctorId || !patientId) return;

			assignedPatientIds.add(patientId);

			const doctorEntry = doctorPatientMap.get(doctorId);
			if (doctorEntry) {
				doctorEntry.patients.push({
					assignmentId: assignment._id,
					assignedDate: assignment.assignedDate,
					userId: patientMap.get(patientId)?.userId,
					procedure: patientMap.get(patientId)?.procedure,
					procedureDate: patientMap.get(patientId)?.procedureDate,
				});

				doctorEntry.patientCount++;
			}
		});

		// Find unassigned patients
		const unassignedPatients = allPatients
			.filter((p) => !assignedPatientIds.has(p._id?.toString()))
			.map((patient) => ({
				_id: patient._id,
				userId: patient.userId,
				procedure: patient.procedure,
				procedureDate: patient.procedureDate,
			}));

		const result = Array.from(doctorPatientMap.values());

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Assignments retrieved successfully",
			data: {
				assignments: result,
				unassignedPatients,
			},
		});
	}
);
