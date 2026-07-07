import { Router } from "express";
import {
	getAllAlerts,
	getAlertById,
	createAlert,
	updateAlertStatus,
	deleteAlert,
	getAlertStats,
	markAlertAsViewed,
} from "../controllers/alert.controller.js";

const router = Router();

router.get("/", getAllAlerts);
router.get("/stats", getAlertStats);
router.get("/:alertId", getAlertById);
router.post("/", createAlert);
router.patch("/:alertId", updateAlertStatus);
router.patch("/:alertId/view", markAlertAsViewed);
router.delete("/:alertId", deleteAlert);

export default router;
