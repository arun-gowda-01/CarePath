import { Router } from "express";
import {
	addPatient,
	deletePatient,
	getAllPatients,
	getPatientById,
	seedPatients,
	updatePatient,
} from "../controllers/patient-management.controller.js";
import {
	addDoctor,
	deleteDoctor,
	getAllDoctors,
	getDoctorById,
	seedDoctors,
	updateDoctor,
} from "../controllers/doctor-management.controller.js";
import {
	assignPatientToDoctor,
	deleteAssignment,
	getAllAssignments,
} from "../controllers/assignment.controller.js";

const router = Router();

router.get("/patients", getAllPatients);
router.get("/patient/:patientId", getPatientById);
router.post("/patient", addPatient);
router.patch("/patient/:patientId", updatePatient);
router.delete("/patient/:patientId", deletePatient);

router.get("/doctors", getAllDoctors);
router.get("/doctor/:doctorId", getDoctorById);
router.post("/doctor", addDoctor);
router.patch("/doctor/:doctorId", updateDoctor);
router.delete("/doctor/:doctorId", deleteDoctor);

router.get("/assignments", getAllAssignments);
router.post("/assignment", assignPatientToDoctor);
router.delete("/assignment/:id", deleteAssignment);

router.post("/seed-patients", seedPatients);
router.post("/seed-doctors", seedDoctors);

export default router;
