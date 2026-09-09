import express, {
        Express,
        Request,
        Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import User from "./models/User.js";
import apiResponseHandler from "./middlewares/apiResponseHandler.middleware.js";
import asyncHandler from "./utils/asyncHandler.js";
import { ApiError } from "./utils/apiError.js";
import { validateRequest } from "./utils/validation.js";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// CORS
// ------------------------------------------------------------

const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://10.169.189.210:5173",
].filter((origin): origin is string => Boolean(origin));

app.use(
        cors({
                origin: (
                        origin,
                        callback
                ) => {
                        // Allow requests without an Origin header
                        // such as health checks/server-to-server requests.
                        if (!origin) {
                                callback(null, true);
                                return;
                        }

                        if (
                                allowedOrigins.includes(
                                        origin
                                )
                        ) {
                                callback(null, true);
                                return;
                        }

                        callback(
                                new Error(
                                        "Not allowed by CORS"
                                )
                        );
                },
                credentials: true,
        })
);

app.use(cookieParser());
app.use(apiResponseHandler);

// ------------------------------------------------------------
// Routers
// ------------------------------------------------------------

import authRouter from "./routers/auth.route.js";
import adminRouter from "./routers/admin.route.js";
import patientRouter from "./routers/patient.route.js";
import doctorRouter from "./routers/doctor.route.js";
import messageRouter from "./routers/message.route.js";
import alertRouter from "./routers/alert.route.js";
import analyticsRouter from "./routers/analytics.route.js";
import videoCallRouter from "./routers/video-call.route.js";
import medicationRouter from "./routers/medication.route.js";

import {
        authorizeAdmin,
        authorizeDoctor,
        authorizePatient,
} from "./middlewares/authorization.middleware.js";

import { authMiddleware } from "./middlewares/auth.middleware.js";

// ------------------------------------------------------------
// API Routes
// ------------------------------------------------------------

app.use(
        "/api/v1/auth",
        authRouter
);

app.use(
        "/api/v1/admin",
        authMiddleware,
        authorizeAdmin,
        adminRouter
);

app.use(
        "/api/v1/patient",
        authMiddleware,
        authorizePatient,
        patientRouter
);

app.use(
        "/api/v1/doctor",
        authMiddleware,
        authorizeDoctor,
        doctorRouter
);

app.use(
        "/api/v1/messages",
        authMiddleware,
        messageRouter
);

app.use(
        "/api/v1/alerts",
        authMiddleware,
        alertRouter
);

app.use(
        "/api/v1/analytics",
        authMiddleware,
        analyticsRouter
);

app.use(
        "/api/v1/video-call",
        authMiddleware,
        videoCallRouter
);

app.use(
        "/api/v1/medications",
        authMiddleware,
        authorizeDoctor,
        medicationRouter
);

// ------------------------------------------------------------
// Health Check
// ------------------------------------------------------------

app.get(
        "/api/health",
        (req: Request, res: Response) => {
                res.status(200).json({
                        status: "OK",
                        message:
                                "Server is healthy",
                });
        }
);

// ------------------------------------------------------------
// Admin Registration
// ------------------------------------------------------------

app.post(
        "/api/v1/register-admin",
        asyncHandler(
                async (
                        req: Request,
                        res: Response
                ) => {
                        const {
                                email,
                                firstName,
                                lastName,
                                password,
                        } = req.body;

                        validateRequest([
                                {
                                        field: "email",
                                        value: email,
                                        rules: {
                                                required: true,
                                                type: "email",
                                        },
                                },
                                {
                                        field: "firstName",
                                        value: firstName,
                                        rules: {
                                                required: true,
                                                type: "string",
                                                minLength: 1,
                                        },
                                },
                                {
                                        field: "lastName",
                                        value: lastName,
                                        rules: {
                                                required: true,
                                                type: "string",
                                                minLength: 1,
                                        },
                                },
                                {
                                        field: "password",
                                        value: password,
                                        rules: {
                                                required: true,
                                                type: "string",
                                                minLength: 6,
                                        },
                                },
                        ]);

                        const existingAdmin =
                                await User.findOne({
                                        email,
                                        role: "admin",
                                });

                        if (
                                existingAdmin
                        ) {
                                throw new ApiError(
                                        "Admin with this email already exists",
                                        400
                                );
                        }

                        const createdAdmin =
                                await User.create({
                                        email,
                                        firstName,
                                        lastName,
                                        password,
                                        role: "admin",
                                });

                        return res.sendResponse({
                                statusCode: 201,
                                success: true,
                                message:
                                        "Admin registered successfully",
                                data: {
                                        id: createdAdmin._id,
                                },
                        });
                }
        )
);

export default app;