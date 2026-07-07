import { Request, Response } from "express";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Alert from "../models/Alert.js";
import SymptomCheckIn from "../models/SymptomCheckIn.js";
import Task from "../models/Task.js";
import Assignment from "../models/Assignment.js";
import User from "../models/User.js";
import Medication from "../models/Medication.js";
import {
	calculateComprehensiveAdherence,
	calculateTaskAdherence,
	calculateMedicationAdherence,
} from "../utils/adherenceCalculator.js";

// Admin Dashboard Analytics
export const getAdminAnalytics = asyncHandler(
	async (req: Request, res: Response) => {
		const [
			totalPatients,
			activePatients,
			totalDoctors,
			totalAlerts,
			criticalAlerts,
			activeAlerts,
			totalCheckIns,
			recentPatients,
			recentAlerts,
		] = await Promise.all([
			Patient.countDocuments(),
			Patient.countDocuments({ status: "active" }),
			Doctor.countDocuments(),
			Alert.countDocuments(),
			Alert.countDocuments({ severity: "critical", status: "active" }),
			Alert.countDocuments({ status: "active" }),
			SymptomCheckIn.countDocuments(),
			Patient.find()
				.populate("userId", "firstName lastName email")
				.sort({ createdAt: -1 })
				.limit(5),
			Alert.find({ status: "active" })
				.populate("patientId", "userId procedure")
				.populate({
					path: "patientId",
					populate: {
						path: "userId",
						select: "firstName lastName",
					},
				})
				.sort({ createdAt: -1 })
				.limit(10),
		]);

		// Risk level distribution
		const [stablePatients, monitorPatients, criticalPatients] =
			await Promise.all([
				Patient.countDocuments({ riskLevel: "stable" }),
				Patient.countDocuments({ riskLevel: "monitor" }),
				Patient.countDocuments({ riskLevel: "critical" }),
			]);

		// Get check-in trends (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const checkInTrends = await SymptomCheckIn.aggregate([
			{
				$match: {
					checkInDate: { $gte: thirtyDaysAgo },
				},
			},
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$checkInDate",
						},
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Admin analytics retrieved successfully",
			data: {
				overview: {
					totalPatients,
					activePatients,
					recoveredPatients: totalPatients - activePatients,
					totalDoctors,
					totalAlerts,
					criticalAlerts,
					activeAlerts,
					totalCheckIns,
				},
				riskDistribution: {
					stable: stablePatients,
					monitor: monitorPatients,
					critical: criticalPatients,
				},
				checkInTrends,
				recentPatients,
				recentAlerts,
			},
		});
	}
);

// Doctor Dashboard Analytics
export const getDoctorAnalytics = asyncHandler(
	async (req: Request, res: Response) => {
		const doctorUserId = req.user?.id;

		// Find doctor document
		const doctor = await Doctor.findOne({ userId: doctorUserId });
		if (!doctor) {
			return res.sendResponse({
				statusCode: 200,
				success: true,
				message: "Doctor analytics retrieved successfully",
				data: {
					assignedPatients: [],
					totalAssignedPatients: 0,
					criticalPatients: 0,
					activeAlerts: 0,
					recentCheckIns: [],
				},
			});
		}

		// Get assigned patients
		const assignments = await Assignment.find({
			doctorId: doctor._id,
			status: { $ne: "inactive" },
		});
		const patientIds = assignments.map((a) => a.patientId);

		const [patients, criticalPatients, activeAlerts, recentCheckIns] =
			await Promise.all([
				Patient.find({ _id: { $in: patientIds } })
					.populate("userId", "firstName lastName email")
					.sort({ riskLevel: -1 }),
				Patient.countDocuments({
					_id: { $in: patientIds },
					riskLevel: "critical",
				}),
				Alert.find({
					patientId: { $in: patientIds },
					status: "active",
					viewedBy: {
						$ne: new mongoose.Types.ObjectId(doctorUserId),
					},
				})
					.populate("patientId", "userId procedure")
					.populate({
						path: "patientId",
						populate: {
							path: "userId",
							select: "firstName lastName",
						},
					})
					.sort({ severity: -1, createdAt: -1 })
					.limit(10),
				SymptomCheckIn.find({
					patientId: { $in: patientIds },
				})
					.populate("patientId", "userId procedure")
					.populate({
						path: "patientId",
						populate: {
							path: "userId",
							select: "firstName lastName",
						},
					})
					.sort({ checkInDate: -1 })
					.limit(10),
			]);

		// Enhance each patient with alert count, last check-in, and adherence
		const assignedPatients = await Promise.all(
			patients.map(async (patient) => {
				const [alertCount, lastCheckIn, adherenceMetrics] =
					await Promise.all([
						Alert.countDocuments({
							patientId: patient._id,
							status: "active",
							viewedBy: {
								$ne: new mongoose.Types.ObjectId(doctorUserId),
							},
						}),
						SymptomCheckIn.findOne({ patientId: patient._id })
							.sort({ checkInDate: -1 })
							.select("checkInDate"),
						calculateComprehensiveAdherence(patient._id.toString()),
					]);

				// Update patient adherence rate in database
				if (patient.adherenceRate !== adherenceMetrics.overallAdherence) {
					patient.adherenceRate = adherenceMetrics.overallAdherence;
					await patient.save();
				}

				return {
					...patient.toObject(),
					alertCount,
					lastCheckIn: lastCheckIn?.checkInDate || null,
					adherence: adherenceMetrics.overallAdherence,
					taskAdherence: adherenceMetrics.taskAdherence,
					medicationAdherence: adherenceMetrics.medicationAdherence,
				};
			})
		); // Risk distribution
		const riskDistribution = {
			stable: assignedPatients.filter((p) => p.riskLevel === "stable")
				.length,
			monitor: assignedPatients.filter((p) => p.riskLevel === "monitor")
				.length,
			critical: assignedPatients.filter((p) => p.riskLevel === "critical")
				.length,
		};

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Doctor analytics retrieved successfully",
			data: {
				assignedPatients,
				totalAssignedPatients: patientIds.length,
				criticalPatients,
				activeAlerts: activeAlerts.length,
				riskDistribution,
				recentAlerts: activeAlerts,
				recentCheckIns,
			},
		});
	}
);

// Patient Dashboard Analytics
export const getPatientAnalytics = asyncHandler(
	async (req: Request, res: Response) => {
		const patientUserId = req.user?.id;

		// Find patient document
		const patient = await Patient.findOne({
			userId: patientUserId,
		}).populate("userId", "firstName lastName email");
		if (!patient) {
			return res.sendResponse({
				statusCode: 200,
				success: true,
				message: "Patient analytics retrieved successfully",
				data: {
					patient: null,
					stats: {},
				},
			});
		}

		const [totalCheckIns, totalTasks, completedTasks, activeAlerts] =
			await Promise.all([
				SymptomCheckIn.countDocuments({ patientId: patient._id }),
				Task.countDocuments({ patientId: patient._id }),
				Task.countDocuments({
					patientId: patient._id,
					completed: true,
				}),
				Alert.countDocuments({
					patientId: patient._id,
					status: "active",
				}),
			]);

		// Get recent check-ins for trends
		const recentCheckIns = await SymptomCheckIn.find({
			patientId: patient._id,
		})
			.sort({ checkInDate: -1 })
			.limit(7);

		// Calculate comprehensive adherence (tasks + medications)
		const adherenceMetrics = await calculateComprehensiveAdherence(
			patient._id.toString()
		);

		// Update patient adherence rate in database
		if (patient.adherenceRate !== adherenceMetrics.overallAdherence) {
			patient.adherenceRate = adherenceMetrics.overallAdherence;
			await patient.save();
		}

		// Get assigned doctor
		const assignment = await Assignment.findOne({
			patientId: patient._id,
		}).populate({
			path: "doctorId",
			populate: {
				path: "userId",
				select: "firstName lastName email",
			},
		});

		// Calculate days post-op
		const daysPostOp = Math.floor(
			(Date.now() - new Date(patient.procedureDate).getTime()) /
				(1000 * 60 * 60 * 24)
		);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patient analytics retrieved successfully",
			data: {
				patient: {
					procedure: patient.procedure,
					procedureDate: patient.procedureDate,
					riskLevel: patient.riskLevel,
					status: patient.status,
					daysPostOp,
					monitoringDays: patient.monitoringDays ?? 7,
					_id: patient._id,
				},
				stats: {
					totalCheckIns,
					totalTasks,
					completedTasks,
					pendingTasks: totalTasks - completedTasks,
					adherenceRate: adherenceMetrics.overallAdherence,
					taskAdherence: adherenceMetrics.taskAdherence,
					medicationAdherence: adherenceMetrics.medicationAdherence,
					activeAlerts,
					taskDetails: adherenceMetrics.taskDetails,
					medicationDetails: adherenceMetrics.medicationDetails,
				},
				recentCheckIns,
				assignedDoctor: assignment?.doctorId,
			},
		});
	}
);

// System-wide statistics
export const getSystemStats = asyncHandler(
	async (req: Request, res: Response) => {
		const [
			totalUsers,
			totalPatients,
			totalDoctors,
			totalAdmins,
			totalAlerts,
			totalCheckIns,
			totalTasks,
		] = await Promise.all([
			User.countDocuments(),
			Patient.countDocuments(),
			Doctor.countDocuments(),
			User.countDocuments({ role: "admin" }),
			Alert.countDocuments(),
			SymptomCheckIn.countDocuments(),
			Task.countDocuments(),
		]);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "System statistics retrieved successfully",
			data: {
				users: {
					total: totalUsers,
					patients: totalPatients,
					doctors: totalDoctors,
					admins: totalAdmins,
				},
				activity: {
					totalAlerts,
					totalCheckIns,
					totalTasks,
				},
			},
		});
	}
);

/**
 * Get detailed adherence metrics for a patient
 * @route GET /api/doctor/adherence/:patientId
 * @access Private (Doctor)
 */
export const getPatientAdherence = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { startDate, endDate } = req.query;

		const doctorUserId = req.user?.id;
		if (!doctorUserId) {
			throw new ApiError("Unauthorized", 401);
		}

		// Verify doctor has access to this patient
		const doctor = await Doctor.findOne({ userId: doctorUserId });
		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

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

		const start = startDate ? new Date(startDate as string) : undefined;
		const end = endDate ? new Date(endDate as string) : undefined;

		const adherenceMetrics = await calculateComprehensiveAdherence(
			patientId,
			start,
			end
		);

		// Update patient adherence rate
		const patient = await Patient.findById(patientId);
		if (patient) {
			patient.adherenceRate = adherenceMetrics.overallAdherence;
			await patient.save();
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Adherence metrics retrieved successfully",
			data: adherenceMetrics,
		});
	}
);

/**
 * Get adherence analytics for all assigned patients (Doctor view)
 * @route GET /api/doctor/adherence-analytics
 * @access Private (Doctor)
 */
export const getDoctorAdherenceAnalytics = asyncHandler(
	async (req: Request, res: Response) => {
		const doctorUserId = req.user?.id;
		if (!doctorUserId) {
			throw new ApiError("Unauthorized", 401);
		}

		const doctor = await Doctor.findOne({ userId: doctorUserId });
		if (!doctor) {
			throw new ApiError("Doctor not found", 404);
		}

		// Get assigned patients
		const assignments = await Assignment.find({
			doctorId: doctor._id,
			status: { $ne: "inactive" },
		});
		const patientIds = assignments.map((a) => a.patientId);

		const patients = await Patient.find({
			_id: { $in: patientIds },
		}).populate("userId", "firstName lastName email");

		// Calculate adherence for each patient
		const patientsWithAdherence = await Promise.all(
			patients.map(async (patient) => {
				const adherence = await calculateComprehensiveAdherence(
					patient._id.toString()
				);

				// Update patient adherence rate
				if (patient.adherenceRate !== adherence.overallAdherence) {
					patient.adherenceRate = adherence.overallAdherence;
					await patient.save();
				}

				return {
					patientId: patient._id,
					patientName: `${patient.userId.firstName} ${patient.userId.lastName}`,
					procedure: patient.procedure,
					adherence: adherence.overallAdherence,
					taskAdherence: adherence.taskAdherence,
					medicationAdherence: adherence.medicationAdherence,
					taskDetails: adherence.taskDetails,
					medicationDetails: adherence.medicationDetails,
				};
			})
		);

		// Calculate aggregate statistics
		const totalPatients = patientsWithAdherence.length;
		const avgAdherence =
			totalPatients > 0
				? Math.round(
						patientsWithAdherence.reduce(
							(sum, p) => sum + p.adherence,
							0
						) / totalPatients
				  )
				: 0;

		const avgTaskAdherence =
			totalPatients > 0
				? Math.round(
						patientsWithAdherence.reduce(
							(sum, p) => sum + p.taskAdherence,
							0
						) / totalPatients
				  )
				: 0;

		const avgMedicationAdherence =
			totalPatients > 0
				? Math.round(
						patientsWithAdherence.reduce(
							(sum, p) => sum + p.medicationAdherence,
							0
						) / totalPatients
				  )
				: 0;

		// Adherence distribution
		const excellentAdherence = patientsWithAdherence.filter(
			(p) => p.adherence >= 90
		).length;
		const goodAdherence = patientsWithAdherence.filter(
			(p) => p.adherence >= 75 && p.adherence < 90
		).length;
		const needsAttention = patientsWithAdherence.filter(
			(p) => p.adherence < 75
		).length;

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Adherence analytics retrieved successfully",
			data: {
				summary: {
					totalPatients,
					avgAdherence,
					avgTaskAdherence,
					avgMedicationAdherence,
					excellentAdherence,
					goodAdherence,
					needsAttention,
				},
				patients: patientsWithAdherence,
			},
		});
	}
);
