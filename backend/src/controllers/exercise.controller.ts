import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import Exercise from "../models/Exercise.js";
import Task from "../models/Task.js";
import Patient from "../models/Patient.js";

// ============================================================
// SEARCH EXERCISES FROM MONGODB
// ============================================================

export const searchExercisesFromAPI = asyncHandler(
    async (req: Request, res: Response) => {
        const { bodyPart, search } = req.query;

        if (!bodyPart && !search) {
            throw new ApiError(
                "Body part or search term is required",
                400
            );
        }

        const query: any = {};

        if (bodyPart) {
            query.bodyParts = {
                $regex: `^${String(bodyPart).trim()}$`,
                $options: "i",
            };
        }

        if (search) {
            query.name = {
                $regex: String(search).trim(),
                $options: "i",
            };
        }

        const mongoExercises = await Exercise.find(query)
            .sort({ name: 1 })
            .lean();

        // Convert MongoDB field name to the field name
        // expected by the existing frontend.
        const exercises = mongoExercises.map((exercise) => ({
            ...exercise,
            exerciseId: exercise.exerciseDbId,
        }));

        console.log(
            `MongoDB exercise search: ${exercises.length} exercises found`
        );

        return res.sendResponse({
            statusCode: 200,
            success: true,
            message: "Exercises retrieved successfully from MongoDB",
            data: exercises,
        });
    }
);

// ============================================================
// GET BODY PARTS FROM MONGODB
// ============================================================

export const getBodyParts = asyncHandler(
    async (req: Request, res: Response) => {
        // Get all unique body parts from the 1500 exercises
        const bodyParts = await Exercise.distinct("bodyParts");

        // Remove empty values and sort alphabetically
        const cleanedBodyParts = bodyParts
            .filter(
                (part): part is string =>
                    typeof part === "string" && part.trim().length > 0
            )
            .map((part) => part.trim())
            .filter(
                (part, index, array) =>
                    array.findIndex(
                        (item) =>
                            item.toLowerCase() === part.toLowerCase()
                    ) === index
            )
            .sort((a, b) => a.localeCompare(b));

        console.log(
            `MongoDB body parts: ${cleanedBodyParts.length}`
        );

        return res.sendResponse({
            statusCode: 200,
            success: true,
            message: "Body parts retrieved successfully from MongoDB",
            data: cleanedBodyParts,
        });
    }
);

// ============================================================
// ASSIGN EXERCISE TO PATIENT
// ============================================================

export const assignExerciseToPatient = asyncHandler(
    async (req: Request, res: Response) => {
        const {
            patientId,
            exerciseData,
            scheduledTime,
            priority,
            recurring,
        } = req.body;

        validateRequest([
            {
                field: "patientId",
                value: patientId,
                rules: {
                    required: true,
                    type: "string",
                },
            },
            {
                field: "exerciseData",
                value: exerciseData,
                rules: {
                    required: true,
                    type: "object",
                },
            },
        ]);

        // ------------------------------------------------
        // Check patient
        // ------------------------------------------------

        const patient = await Patient.findById(patientId);

        if (!patient) {
            throw new ApiError(
                "Patient not found",
                404
            );
        }

        // ------------------------------------------------
        // Get ExerciseDB ID
        // ------------------------------------------------

        const exerciseDbId =
            exerciseData.exerciseId ||
            exerciseData.exerciseDbId;

        if (!exerciseDbId) {
            throw new ApiError(
                "Exercise ID is required",
                400
            );
        }

        // ------------------------------------------------
        // Find exercise in MongoDB
        // Use exerciseDbId only
        // ------------------------------------------------

        const existingExercise =
            await Exercise.findOne({
                exerciseDbId: String(exerciseDbId),
            });

        if (!existingExercise) {
            throw new ApiError(
                "Exercise not found in MongoDB",
                404
            );
        }

        // ------------------------------------------------
        // Exercise information
        // ------------------------------------------------

        const equipment =
            existingExercise.equipments?.join(", ") ||
            "bodyweight";

        const targetMuscles =
            existingExercise.targetMuscles?.join(", ") ||
            "N/A";

        // ------------------------------------------------
        // Create task
        // ------------------------------------------------

        const task = await Task.create({
            patientId,

            title: existingExercise.name,

            description:
                `Target: ${targetMuscles} | Equipment: ${equipment}`,

            type: "exercise",

            exerciseId: existingExercise._id,

            scheduledTime: scheduledTime
                ? new Date(scheduledTime)
                : new Date(),

            priority:
                priority || "medium",

            recurring,
        });

        // ------------------------------------------------
        // Populate exercise
        // ------------------------------------------------

        const populatedTask =
            await Task.findById(task._id)
                .populate("exerciseId");

        return res.sendResponse({
            statusCode: 201,
            success: true,
            message:
                "Exercise assigned to patient successfully",
            data: populatedTask,
        });
    }
);

// ============================================================
// GET ALL EXERCISES ASSIGNED TO PATIENT
// ============================================================

// ============================================================
// GET EXERCISES ASSIGNED TO PATIENT
// ============================================================

export const getPatientExercises = asyncHandler(
    async (req: Request, res: Response) => {
        const { patientId } = req.params;

        const {
            completed,
            startDate,
            endDate,
        } = req.query;

        const now = new Date();

        const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const tomorrowStart = new Date(
            todayStart
        );

        tomorrowStart.setDate(
            tomorrowStart.getDate() + 1
        );

        // --------------------------------------------------------
        // Get all exercise tasks for this patient
        // --------------------------------------------------------

        const allTasks = await Task.find({
            patientId,
            type: "exercise",
        })
            .populate("exerciseId")
            .sort({
                scheduledTime: 1,
            });

        // --------------------------------------------------------
        // Ensure today's occurrence exists for daily exercises
        // --------------------------------------------------------

        const exerciseGroups = new Map<
            string,
            typeof allTasks
        >();

        for (const task of allTasks) {
            const exerciseId =
                task.exerciseId?._id?.toString();

            if (!exerciseId) {
                continue;
            }

            if (
                !exerciseGroups.has(
                    exerciseId
                )
            ) {
                exerciseGroups.set(
                    exerciseId,
                    []
                );
            }

            exerciseGroups
                .get(exerciseId)!
                .push(task);
        }

        for (const [, tasks] of exerciseGroups) {
            const recurringTasks =
                tasks.filter(
                    (task) =>
                        task.recurring?.enabled ===
                            true &&
                        task.recurring?.frequency ===
                            "daily"
                );

            if (
                recurringTasks.length === 0
            ) {
                continue;
            }

            // Find the latest occurrence
            const latestTask =
                recurringTasks.reduce(
                    (latest, current) =>
                        new Date(
                            current.scheduledTime
                        ).getTime() >
                        new Date(
                            latest.scheduledTime
                        ).getTime()
                            ? current
                            : latest
                );

            const latestDate =
                new Date(
                    latestTask.scheduledTime
                );

            const latestDayStart =
                new Date(
                    latestDate.getFullYear(),
                    latestDate.getMonth(),
                    latestDate.getDate()
                );

            // Already have today's occurrence
            if (
                latestDayStart.getTime() ===
                todayStart.getTime()
            ) {
                continue;
            }

            // Latest occurrence is already in the future
            if (
                latestDayStart.getTime() >
                todayStart.getTime()
            ) {
                continue;
            }

            // ----------------------------------------------------
            // Create missing daily occurrences until today
            // ----------------------------------------------------

            let nextDate = new Date(
                latestDate
            );

            nextDate.setDate(
                nextDate.getDate() + 1
            );

            while (
                nextDate < tomorrowStart
            ) {
                const endDate =
                    latestTask.recurring
                        ?.endDate
                        ? new Date(
                              latestTask
                                  .recurring
                                  .endDate
                          )
                        : null;

                if (
                    endDate &&
                    nextDate.getTime() >
                        endDate.getTime()
                ) {
                    break;
                }

                const alreadyExists =
                    await Task.findOne({
                        patientId:
                            latestTask.patientId,
                        type: "exercise",
                        exerciseId:
                            latestTask.exerciseId,
                        scheduledTime:
                            nextDate,
                    });

                if (!alreadyExists) {
                    await Task.create({
                        patientId:
                            latestTask.patientId,

                        title:
                            latestTask.title,

                        description:
                            latestTask.description,

                        type: "exercise",

                        exerciseId:
                            latestTask.exerciseId,

                        scheduledTime:
                            new Date(
                                nextDate
                            ),

                        completed: false,

                        priority:
                            latestTask.priority,

                        recurring:
                            latestTask.recurring,
                    });
                }

                nextDate = new Date(
                    nextDate
                );

                nextDate.setDate(
                    nextDate.getDate() + 1
                );
            }
        }

        // --------------------------------------------------------
        // Build final query
        // --------------------------------------------------------

        const query: any = {
            patientId,
            type: "exercise",
        };

        // --------------------------------------------------------
        // Completed filter
        // --------------------------------------------------------

        if (
            completed !== undefined
        ) {
            query.completed =
                completed === "true";
        }

        // --------------------------------------------------------
        // Date filter
        // --------------------------------------------------------

        if (
            startDate ||
            endDate
        ) {
            query.scheduledTime = {};

            if (startDate) {
                query.scheduledTime.$gte =
                    new Date(
                        startDate as string
                    );
            }

            if (endDate) {
                query.scheduledTime.$lte =
                    new Date(
                        endDate as string
                    );
            }
        }

        // --------------------------------------------------------
        // If no explicit date filter is supplied,
        // return today's exercise occurrence(s).
        // --------------------------------------------------------

        if (
            !startDate &&
            !endDate
        ) {
            query.scheduledTime = {
                $gte: todayStart,
                $lt: tomorrowStart,
            };
        }

        const tasks =
            await Task.find(query)
                .populate(
                    "exerciseId"
                )
                .sort({
                    scheduledTime: 1,
                });

        return res.sendResponse({
            statusCode: 200,
            success: true,
            message:
                "Patient exercises retrieved successfully",
            data: tasks,
        });
    }
);

// ============================================================
// UPDATE EXERCISE ASSIGNMENT
// ============================================================

export const updateExerciseAssignment = asyncHandler(
        async (req: Request, res: Response) => {
                const { taskId } = req.params;

                const {
                        completed,
                        scheduledTime,
                        priority,
                } = req.body;

                const task = await Task.findOne({
                        _id: taskId,
                        type: "exercise",
                });

                if (!task) {
                        throw new ApiError(
                                "Exercise task not found",
                                404
                        );
                }

                const wasCompleted = task.completed;

                if (completed !== undefined) {
                        task.completed = completed;

                        if (completed) {
                                task.completedAt = new Date();
                        } else {
                                task.completedAt = undefined;
                        }
                }

                if (scheduledTime) {
                        task.scheduledTime = new Date(scheduledTime);
                }

                if (priority) {
                        task.priority = priority;
                }

                await task.save();

                // ------------------------------------------------
                // Create next daily occurrence
                // ------------------------------------------------
                if (
                        completed === true &&
                        wasCompleted === false &&
                        task.recurring?.enabled === true &&
                        task.recurring.frequency === "daily"
                ) {
                        const nextScheduledTime = new Date(
                                task.scheduledTime
                        );

                        nextScheduledTime.setDate(
                                nextScheduledTime.getDate() + 1
                        );

                        const endDate = task.recurring.endDate
                                ? new Date(task.recurring.endDate)
                                : null;

                        const allowedToCreateNext =
                                !endDate ||
                                nextScheduledTime.getTime() <=
                                        endDate.getTime();

                        if (allowedToCreateNext) {
                                const existingNextTask =
                                        await Task.findOne({
                                                patientId: task.patientId,
                                                type: "exercise",
                                                exerciseId: task.exerciseId,
                                                scheduledTime: nextScheduledTime,
                                        });

                                if (!existingNextTask) {
                                        await Task.create({
                                                patientId: task.patientId,
                                                title: task.title,
                                                description: task.description,
                                                type: "exercise",
                                                exerciseId: task.exerciseId,
                                                scheduledTime:
                                                        nextScheduledTime,
                                                completed: false,
                                                priority: task.priority,
                                                recurring: task.recurring,
                                        });
                                }
                        }
                }

                const populatedTask = await Task.findById(
                        task._id
                ).populate("exerciseId");

                return res.sendResponse({
                        statusCode: 200,
                        success: true,
                        message:
                                "Exercise assignment updated successfully",
                        data: populatedTask,
                });
        }
);

// ============================================================
// DELETE EXERCISE ASSIGNMENT
// ============================================================

export const deleteExerciseAssignment = asyncHandler(
    async (req: Request, res: Response) => {
        const { taskId } = req.params;

        const task =
            await Task.findOneAndDelete({
                _id: taskId,
                type: "exercise",
            });

        if (!task) {
            throw new ApiError(
                "Exercise task not found",
                404
            );
        }

        return res.sendResponse({
            statusCode: 200,
            success: true,
            message:
                "Exercise assignment deleted successfully",
            data: task,
        });
    }
);

// ============================================================
// GET ALL EXERCISES FROM MONGODB
// ============================================================

export const getAllExercises = asyncHandler(
    async (req: Request, res: Response) => {
        const exercises =
            await Exercise.find()
                .sort({ name: 1 })
                .lean();

        return res.sendResponse({
            statusCode: 200,
            success: true,
            message:
                "All exercises retrieved successfully from MongoDB",
            data: exercises,
        });
    }
);