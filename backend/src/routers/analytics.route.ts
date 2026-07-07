import { Router } from "express";
import {
	getAdminAnalytics,
	getSystemStats,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/admin", getAdminAnalytics);
router.get("/system", getSystemStats);

export default router;
