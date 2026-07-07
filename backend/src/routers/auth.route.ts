import { Router } from "express";
import {
	getCurrentUser,
	login,
	logout,
	updateProfile,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, getCurrentUser);
router.patch("/profile", authMiddleware, updateProfile);

export default router;
