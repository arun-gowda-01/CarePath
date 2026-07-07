import { Router } from "express";
import {
	submitSymptomCheckIn,
	getPatientCheckIns,
	getRecoveryTrends,
	getCheckInById,
} from "../controllers/symptom-checkin.controller.js";
import {
	getPatientTasks,
	createTask,
	updateTask,
	deleteTask,
	getTaskStats,
} from "../controllers/task.controller.js";
import { getPatientAnalytics } from "../controllers/analytics.controller.js";
import {
	getMyMedications,
	markDoseAsTaken,
} from "../controllers/medication.controller.js";
import {
	getPatientExercises,
	updateExerciseAssignment,
} from "../controllers/exercise.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

// Symptom Check-ins (Daily Health Updates)
router.post("/check-in", upload.single("woundImage"), submitSymptomCheckIn);
router.get("/check-ins/:patientId", getPatientCheckIns);
router.get("/check-in/:checkInId", getCheckInById);
router.get("/recovery-trends/:patientId", getRecoveryTrends);

// Tasks
router.get("/tasks/:patientId", getPatientTasks);
router.post("/task", createTask);
router.patch("/task/:taskId", updateTask);
router.delete("/task/:taskId", deleteTask);
router.get("/task-stats/:patientId", getTaskStats);

// Medications (Patient-specific)
router.get("/medications", getMyMedications);
router.post("/medications/:id/take-dose", markDoseAsTaken);

// Exercises (Patient can view and update their exercises)
router.get("/exercises/:patientId", getPatientExercises);
router.patch("/exercise/:taskId", updateExerciseAssignment);

// Analytics
router.get("/analytics", getPatientAnalytics);

export default router;
