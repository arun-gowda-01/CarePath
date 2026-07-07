import mongoose, { Document, Model, Schema } from "mongoose";

export interface INoteAttachment {
	filename?: string;
	url?: string;
	fileType?: string;
	uploadedAt?: Date;
}

export interface INote extends Document {
	patientId: mongoose.Types.ObjectId;
	authorId: mongoose.Types.ObjectId;
	type:
		| "Clinical"
		| "Progress"
		| "Intervention"
		| "Consultation"
		| "Discharge"
		| "Other";
	title?: string;
	content: string;
	priority: "low" | "medium" | "high";
	isPrivate: boolean;
	attachments?: INoteAttachment[];
	tags?: string[];
	createdAt: Date;
	updatedAt: Date;
}

const noteSchema = new Schema<INote>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		authorId: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
			required: true,
		},
		type: {
			type: String,
			enum: [
				"Clinical",
				"Progress",
				"Intervention",
				"Consultation",
				"Discharge",
				"Other",
			],
			required: true,
		},
		title: {
			type: String,
			trim: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		priority: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		isPrivate: {
			type: Boolean,
			default: false,
		},
		attachments: [
			{
				filename: String,
				url: String,
				fileType: String,
				uploadedAt: Date,
			},
		],
		tags: [String],
	},
	{ timestamps: true }
);

noteSchema.index({ patientId: 1, createdAt: -1 });
noteSchema.index({ authorId: 1 });

const Note: Model<INote> = mongoose.model<INote>("Note", noteSchema);

export default Note;
