import { Router } from "express";
import {
	getPatientMedications,
	getMedicationById,
	createMedication,
	updateMedication,
	deleteMedication,
	updateAdherenceRate,
} from "../controllers/medication.controller.js";

const router = Router();

// Get all medications for a patient
router.get("/patient/:patientId", getPatientMedications);

// Get single medication
router.get("/:id", getMedicationById);

// Create new medication
router.post("/", createMedication);

// Update medication
router.put("/:id", updateMedication);

// Delete medication
router.delete("/:id", deleteMedication);

// Update adherence rate
router.patch("/:id/adherence", updateAdherenceRate);

export default router;
