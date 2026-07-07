import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAlertAction {
	action?: string;
	performedBy?: mongoose.Types.ObjectId;
	performedAt?: Date;
	notes?: string;
}

export interface IAlert extends Document {
	patientId: mongoose.Types.ObjectId;
	type:
		| "High Fever"
		| "Severe Pain"
		| "Missed Medication"
		| "Low Adherence"
		| "Abnormal Vitals"
		| "Wound Concern"
		| "Check-in Completed"
		| "Other";
	severity: "normal" | "warning" | "critical";
	message: string;
	status: "active" | "resolved" | "dismissed";
	triggeredBy?: {
		source?:
			| "symptom-checkin"
			| "medication"
			| "task"
			| "manual"
			| "system"
			| "doctor-review";
		referenceId?: mongoose.Types.ObjectId;
	};
	assignedTo?: mongoose.Types.ObjectId;
	actions?: IAlertAction[];
	viewedBy?: mongoose.Types.ObjectId[];
	resolvedBy?: mongoose.Types.ObjectId;
	resolvedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		type: {
			type: String,
			required: true,
			enum: [
				"High Fever",
				"Severe Pain",
				"Missed Medication",
				"Low Adherence",
				"Abnormal Vitals",
				"Wound Concern",
				"Check-in Completed",
				"Other",
			],
		},
		severity: {
			type: String,
			enum: ["normal", "warning", "critical"],
			required: true,
		},
		message: {
			type: String,
			required: true,
			trim: true,
		},
		status: {
			type: String,
			enum: ["active", "resolved", "dismissed"],
			default: "active",
		},
		triggeredBy: {
			source: {
				type: String,
				enum: [
					"symptom-checkin",
					"medication",
					"task",
					"manual",
					"system",
					"doctor-review",
				],
			},
			referenceId: {
				type: Schema.Types.ObjectId,
			},
		},
		assignedTo: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
		},
		actions: [
			{
				action: String,
				performedBy: {
					type: Schema.Types.ObjectId,
					ref: "Doctor",
				},
				performedAt: Date,
				notes: String,
			},
		],
		viewedBy: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
			},
		],
		resolvedBy: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
		},
		resolvedAt: {
			type: Date,
		},
	},
	{ timestamps: true }
);

alertSchema.index({ patientId: 1, status: 1, severity: 1 });
alertSchema.index({ assignedTo: 1, status: 1 });

const Alert: Model<IAlert> = mongoose.model<IAlert>("Alert", alertSchema);

export default Alert;
