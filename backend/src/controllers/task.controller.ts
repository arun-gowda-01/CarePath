import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import Task from "../models/Task.js";
import Patient from "../models/Patient.js";

// Get all tasks for a patient
export const getPatientTasks = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { completed, type, startDate, endDate } = req.query;

		const query: any = { patientId };

		if (completed !== undefined) {
			query.completed = completed === "true";
		}

		if (type) {
			query.type = type;
		}

		if (startDate || endDate) {
			query.scheduledTime = {};
			if (startDate)
				query.scheduledTime.$gte = new Date(startDate as string);
			if (endDate) query.scheduledTime.$lte = new Date(endDate as string);
		}

		const tasks = await Task.find(query).sort({ scheduledTime: 1 });

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Tasks retrieved successfully",
			data: tasks,
		});
	}
);

// Create a new task
export const createTask = asyncHandler(async (req: Request, res: Response) => {
	const {
		patientId,
		title,
		description,
		type,
		scheduledTime,
		priority,
		recurring,
	} = req.body;

	validateRequest([
		{
			field: "patientId",
			value: patientId,
			rules: { required: true, type: "string" },
		},
		{
			field: "title",
			value: title,
			rules: { required: true, type: "string", minLength: 1 },
		},
		{
			field: "type",
			value: type,
			rules: {
				required: true,
				enum: [
					"medication",
					"exercise",
					"check-in",
					"appointment",
					"wound-check",
					"other",
				],
			},
		},
		{
			field: "scheduledTime",
			value: scheduledTime,
			rules: { required: true, type: "date" },
		},
	]);

	const patient = await Patient.findById(patientId);
	if (!patient) {
		throw new ApiError("Patient not found", 404);
	}

	const task = await Task.create({
		patientId,
		title,
		description,
		type,
		scheduledTime: new Date(scheduledTime),
		priority: priority || "medium",
		recurring,
	});

	return res.sendResponse({
		statusCode: 201,
		success: true,
		message: "Task created successfully",
		data: task,
	});
});

// Update task (mark as completed, etc.)
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
	const { taskId } = req.params;
	const { completed, title, description, scheduledTime, priority } = req.body;

	const task = await Task.findById(taskId);
	if (!task) {
		throw new ApiError("Task not found", 404);
	}

	if (completed !== undefined) {
		task.completed = completed;
		if (completed) {
			task.completedAt = new Date();
		} else {
			task.completedAt = undefined;
		}
	}

	if (title !== undefined) task.title = title;
	if (description !== undefined) task.description = description;
	if (scheduledTime) task.scheduledTime = new Date(scheduledTime);
	if (priority) task.priority = priority;

	await task.save();

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Task updated successfully",
		data: task,
	});
});

// Delete a task
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
	const { taskId } = req.params;

	const task = await Task.findByIdAndDelete(taskId);
	if (!task) {
		throw new ApiError("Task not found", 404);
	}

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Task deleted successfully",
		data: task,
	});
});

// Get task statistics for a patient
export const getTaskStats = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;

		const [totalTasks, completedTasks, pendingTasks, overdueTask] =
			await Promise.all([
				Task.countDocuments({ patientId }),
				Task.countDocuments({ patientId, completed: true }),
				Task.countDocuments({ patientId, completed: false }),
				Task.countDocuments({
					patientId,
					completed: false,
					scheduledTime: { $lt: new Date() },
				}),
			]);

		const adherenceRate =
			totalTasks > 0
				? Math.round((completedTasks / totalTasks) * 100)
				: 0;

		// Update patient adherence rate
		const patient = await Patient.findById(patientId);
		if (patient) {
			patient.adherenceRate = adherenceRate;
			await patient.save();
		}

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Task statistics retrieved successfully",
			data: {
				totalTasks,
				completedTasks,
				pendingTasks,
				overdueTasks: overdueTask,
				adherenceRate,
			},
		});
	}
);
