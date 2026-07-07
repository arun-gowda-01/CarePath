import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import Exercise from "../models/Exercise.js";
import Task from "../models/Task.js";
import Patient from "../models/Patient.js";
import axios from "axios";

// ExerciseDB API configuration
const EXERCISEDB_API_URL = "https://www.exercisedb.dev/api/v1";

// Search exercises from ExerciseDB API by muscle group or name
export const searchExercisesFromAPI = asyncHandler(
	async (req: Request, res: Response) => {
		const { bodyPart } = req.query;

		try {
			let url = "";
			if (bodyPart) {
				// Search by muscle group (e.g., abs, chest, biceps)
				url = `${EXERCISEDB_API_URL}/bodyparts/${bodyPart}/exercises`;
			}

			const response = await axios.get(url);

			return res.sendResponse({
				statusCode: 200,
				success: true,
				message: "Exercises retrieved from ExerciseDB successfully",
				data: response.data.data,
			});
		} catch (error: any) {
			if (error.response?.status === 429) {
				throw new ApiError(
					"ExerciseDB API rate limit exceeded. Please try again later.",
					429
				);
			}
			throw new ApiError(
				`Failed to fetch exercises from ExerciseDB: ${error.message}`,
				500
			);
		}
	}
);

// Get available muscle groups/body parts
export const getBodyParts = asyncHandler(
	async (req: Request, res: Response) => {
		try {
			const { data } = await axios.get(`${EXERCISEDB_API_URL}/bodyparts`);

			const bodyParts = data.data.map((el: { name: string }) => el.name);

			return res.sendResponse({
				statusCode: 200,
				success: true,
				message: "Muscles retrieved successfully",
				data: bodyParts,
			});
		} catch (error: any) {
			throw new ApiError(
				`Failed to fetch muscles: ${error.message}`,
				500
			);
		}
	}
);

// Assign exercise to patient (creates both Exercise document and Task)
export const assignExerciseToPatient = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId, exerciseData, scheduledTime, priority, recurring } =
			req.body;

		validateRequest([
			{
				field: "patientId",
				value: patientId,
				rules: { required: true, type: "string" },
			},
			{
				field: "exerciseData",
				value: exerciseData,
				rules: { required: true, type: "object" },
			},
		]);

		const patient = await Patient.findById(patientId);
		if (!patient) {
			throw new ApiError("Patient not found", 404);
		}

		// Create or update Exercise document with exerciseDbId
		const exerciseDoc = await Exercise.findOneAndUpdate(
			{
				exerciseDbId: exerciseData.exerciseId,
			},
			{
				exerciseDbId: exerciseData.exerciseId,
				name: exerciseData.name,
			},
			{
				upsert: true,
				new: true,
			}
		);

		// Create Task linking to the exercise
		const task = await Task.create({
			patientId,
			title: exerciseData.name,
			description: `Target: ${
				exerciseData.targetMuscles?.join(", ") || "N/A"
			} | Equipment: ${exerciseData.equipment || "bodyweight"}`,
			type: "exercise",
			exerciseId: exerciseDoc._id,
			scheduledTime: new Date(scheduledTime),
			priority: priority || "medium",
			recurring,
		});

		// Populate exercise data in task
		const populatedTask = await Task.findById(task._id).populate(
			"exerciseId"
		);

		return res.sendResponse({
			statusCode: 201,
			success: true,
			message: "Exercise assigned to patient successfully",
			data: populatedTask,
		});
	}
);

// Get all exercises assigned to a patient
export const getPatientExercises = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { completed, startDate, endDate } = req.query;

		const query: any = {
			patientId,
			type: "exercise",
		};

		if (completed !== undefined) {
			query.completed = completed === "true";
		}

		if (startDate || endDate) {
			query.scheduledTime = {};
			if (startDate)
				query.scheduledTime.$gte = new Date(startDate as string);
			if (endDate) query.scheduledTime.$lte = new Date(endDate as string);
		}

		const tasks = await Task.find(query)
			.populate("exerciseId")
			.sort({ scheduledTime: 1 });

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Patient exercises retrieved successfully",
			data: tasks,
		});
	}
);

// Update exercise assignment
export const updateExerciseAssignment = asyncHandler(
	async (req: Request, res: Response) => {
		const { taskId } = req.params;
		const { completed, scheduledTime, priority } = req.body;

		const task = await Task.findOne({ _id: taskId, type: "exercise" });
		if (!task) {
			throw new ApiError("Exercise task not found", 404);
		}

		// Update task
		if (completed !== undefined) {
			task.completed = completed;
			if (completed) {
				task.completedAt = new Date();
			} else {
				task.completedAt = undefined;
			}
		}

		if (scheduledTime) task.scheduledTime = new Date(scheduledTime);
		if (priority) task.priority = priority;

		await task.save();

		const populatedTask = await Task.findById(task._id).populate(
			"exerciseId"
		);

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Exercise assignment updated successfully",
			data: populatedTask,
		});
	}
);

// Delete exercise assignment
export const deleteExerciseAssignment = asyncHandler(
	async (req: Request, res: Response) => {
		const { taskId } = req.params;

		const task = await Task.findOneAndDelete({
			_id: taskId,
			type: "exercise",
		});
		if (!task) {
			throw new ApiError("Exercise task not found", 404);
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Exercise assignment deleted successfully",
			data: task,
		});
	}
);

// Get all exercises in the system (for admin/reference)
export const getAllExercises = asyncHandler(
	async (req: Request, res: Response) => {
		const exercises = await Exercise.find().sort({ name: 1 });

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Exercises retrieved successfully",
			data: exercises,
		});
	}
);
