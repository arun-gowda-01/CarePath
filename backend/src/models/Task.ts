import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITask extends Document {
	patientId: mongoose.Types.ObjectId;
	title: string;
	description?: string;
	type:
		| "medication"
		| "exercise"
		| "check-in"
		| "appointment"
		| "wound-check"
		| "other";
	scheduledTime: Date;
	completed: boolean;
	completedAt?: Date;
	priority: "low" | "medium" | "high";
	medicationId?: mongoose.Types.ObjectId;
	exerciseId?: mongoose.Types.ObjectId;
	recurring?: {
		enabled?: boolean;
		frequency?: "daily" | "weekly" | "monthly";
		endDate?: Date;
	};
	createdAt: Date;
	updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		type: {
			type: String,
			enum: [
				"medication",
				"exercise",
				"check-in",
				"appointment",
				"wound-check",
				"other",
			],
			required: true,
		},
		scheduledTime: {
			type: Date,
			required: true,
		},
		completed: {
			type: Boolean,
			default: false,
		},
		completedAt: {
			type: Date,
		},
		priority: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		medicationId: {
			type: Schema.Types.ObjectId,
			ref: "Medication",
		},
		exerciseId: {
			type: Schema.Types.ObjectId,
			ref: "Exercise",
		},
		recurring: {
			enabled: {
				type: Boolean,
				default: false,
			},
			frequency: {
				type: String,
				enum: ["daily", "weekly", "monthly"],
			},
			endDate: Date,
		},
	},
	{ timestamps: true }
);

taskSchema.index({ patientId: 1, scheduledTime: 1 });

const Task: Model<ITask> = mongoose.model<ITask>("Task", taskSchema);

export default Task;
