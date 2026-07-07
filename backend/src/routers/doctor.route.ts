import { Router } from "express";
import {
	createNote,
	getPatientNotes,
	getNoteById,
	updateNote,
	deleteNote,
} from "../controllers/note.controller.js";
import {
	getDoctorAnalytics,
	getPatientAdherence,
	getDoctorAdherenceAnalytics,
} from "../controllers/analytics.controller.js";
import { getPatientById } from "../controllers/patient-management.controller.js";
import {
	getPatientTasks,
	createTask,
	updateTask,
	deleteTask,
	getTaskStats,
} from "../controllers/task.controller.js";
import {
	searchExercisesFromAPI,
	getBodyParts,
	assignExerciseToPatient,
	getPatientExercises,
	updateExerciseAssignment,
	deleteExerciseAssignment,
	getAllExercises,
} from "../controllers/exercise.controller.js";
import {
	getDoctorPatientCheckIns,
	getDoctorSpecificPatientCheckIns,
	getDoctorPatientRecoveryTrends,
	getDoctorCheckInById,
	markCheckInAsReviewed,
	updatePatientRiskLevel,
	updatePatientMonitoringDuration,
} from "../controllers/symptom-checkin.controller.js";
import {
	createFollowUpConsultation,
	getPatientFollowUpConsultations,
	getFollowUpConsultationById,
	updateFollowUpConsultation,
	deleteFollowUpConsultation,
} from "../controllers/followup-consultation.controller.js";

const router = Router();

// Check-ins (Doctor can view patient check-ins)
router.get("/check-ins", getDoctorPatientCheckIns); // All check-ins for assigned patients
router.get("/check-ins/:patientId", getDoctorSpecificPatientCheckIns); // Specific patient's check-ins
router.get("/check-in/:checkInId", getDoctorCheckInById); // Single check-in by ID
router.get("/recovery-trends/:patientId", getDoctorPatientRecoveryTrends); // Recovery trends for a patient
router.patch("/check-in/:checkInId/review", markCheckInAsReviewed);
router.patch("/patient/:patientId/risk-level", updatePatientRiskLevel);
router.patch(
	"/patient/:patientId/monitoring-duration",
	updatePatientMonitoringDuration
);

// Doctor Notes
router.post("/note", createNote);
router.get("/notes/:patientId", getPatientNotes);
router.get("/note/:noteId", getNoteById);
router.patch("/note/:noteId", updateNote);
router.delete("/note/:noteId", deleteNote);

// Tasks (Doctor can manage tasks for assigned patients)
router.get("/tasks/:patientId", getPatientTasks);
router.post("/task", createTask);
router.patch("/task/:taskId", updateTask);
router.delete("/task/:taskId", deleteTask);
router.get("/task-stats/:patientId", getTaskStats);

// Exercises
router.get("/exercises/search", searchExercisesFromAPI);
router.get("/exercises/body-parts", getBodyParts);
router.post("/exercise/assign", assignExerciseToPatient);
router.get("/exercises/:patientId", getPatientExercises);
router.patch("/exercise/:taskId", updateExerciseAssignment);
router.delete("/exercise/:taskId", deleteExerciseAssignment);
router.get("/exercises", getAllExercises);

// Analytics
router.get("/analytics", getDoctorAnalytics);
router.get("/adherence/:patientId", getPatientAdherence);
router.get("/adherence-analytics", getDoctorAdherenceAnalytics);

// Patient Details View
router.get("/patient/:patientId", getPatientById);

// Follow-up Consultations
router.post("/follow-up", createFollowUpConsultation);
router.get("/follow-ups/:patientId", getPatientFollowUpConsultations);
router.get("/follow-up/:followUpId", getFollowUpConsultationById);
router.patch("/follow-up/:followUpId", updateFollowUpConsultation);
router.delete("/follow-up/:followUpId", deleteFollowUpConsultation);

export default router;
