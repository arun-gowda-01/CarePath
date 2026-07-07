import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validateRequest } from "../utils/validation.js";
import Note from "../models/Note.js";
import Patient from "../models/Patient.js";

// Create a new note
export const createNote = asyncHandler(async (req: Request, res: Response) => {
	const {
		patientId,
		type,
		title,
		content,
		priority,
		isPrivate,
		attachments,
		tags,
	} = req.body;

	validateRequest([
		{
			field: "patientId",
			value: patientId,
			rules: { required: true, type: "string" },
		},
		{
			field: "type",
			value: type,
			rules: {
				required: true,
				enum: [
					"Clinical",
					"Progress",
					"Intervention",
					"Consultation",
					"Discharge",
					"Other",
				],
			},
		},
		{
			field: "content",
			value: content,
			rules: { required: true, type: "string", minLength: 1 },
		},
	]);

	const patient = await Patient.findById(patientId);
	if (!patient) {
		throw new ApiError("Patient not found", 404);
	}

	// Get doctor ID from authenticated user
	const doctorId = req.user?.id;
	if (!doctorId) {
		throw new ApiError("Unauthorized", 401);
	}

	const note = await Note.create({
		patientId,
		authorId: doctorId,
		type,
		title,
		content,
		priority: priority || "medium",
		isPrivate: isPrivate || false,
		attachments,
		tags,
	});

	const populatedNote = await Note.findById(note._id).populate(
		"authorId",
		"firstName lastName"
	);

	return res.sendResponse({
		statusCode: 201,
		success: true,
		message: "Note created successfully",
		data: populatedNote,
	});
});

// Get all notes for a patient
export const getPatientNotes = asyncHandler(
	async (req: Request, res: Response) => {
		const { patientId } = req.params;
		const { type, priority, isPrivate } = req.query;

		const query: any = { patientId };

		if (type) query.type = type;
		if (priority) query.priority = priority;
		if (isPrivate !== undefined) query.isPrivate = isPrivate === "true";

		const notes = await Note.find(query)
			.populate("authorId", "firstName lastName role")
			.sort({ createdAt: -1 });

		return res.sendResponse({
			statusCode: 200,
			success: true,
			message: "Notes retrieved successfully",
			data: notes,
		});
	}
);

// Get a single note
export const getNoteById = asyncHandler(async (req: Request, res: Response) => {
	const { noteId } = req.params;

	const note = await Note.findById(noteId).populate(
		"authorId",
		"firstName lastName role"
	);

	if (!note) {
		throw new ApiError("Note not found", 404);
	}

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Note retrieved successfully",
		data: note,
	});
});

// Update a note
export const updateNote = asyncHandler(async (req: Request, res: Response) => {
	const { noteId } = req.params;
	const { title, content, priority, isPrivate, tags } = req.body;

	const note = await Note.findById(noteId);
	if (!note) {
		throw new ApiError("Note not found", 404);
	}

	// Check if the user is the author
	if (note.authorId.toString() !== req.user?.id) {
		throw new ApiError("Unauthorized to update this note", 403);
	}

	if (title !== undefined) note.title = title;
	if (content !== undefined) note.content = content;
	if (priority !== undefined) note.priority = priority;
	if (isPrivate !== undefined) note.isPrivate = isPrivate;
	if (tags !== undefined) note.tags = tags;

	await note.save();

	const updatedNote = await Note.findById(noteId).populate(
		"authorId",
		"firstName lastName role"
	);

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Note updated successfully",
		data: updatedNote,
	});
});

// Delete a note
export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
	const { noteId } = req.params;

	const note = await Note.findById(noteId);
	if (!note) {
		throw new ApiError("Note not found", 404);
	}

	// Check if the user is the author or admin
	if (
		note.authorId.toString() !== req.user?.id &&
		req.user?.role !== "admin"
	) {
		throw new ApiError("Unauthorized to delete this note", 403);
	}

	await Note.findByIdAndDelete(noteId);

	return res.sendResponse({
		statusCode: 200,
		success: true,
		message: "Note deleted successfully",
	});
});
