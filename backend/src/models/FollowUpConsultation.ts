import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFollowUpConsultation extends Document {
	patientId: mongoose.Types.ObjectId;
	doctorId: mongoose.Types.ObjectId;
	title: string;
	description?: string;
	scheduledTime: Date;
	priority: "low" | "medium" | "high";
	location?: string;
	status: "scheduled" | "completed" | "cancelled";
	completedAt?: Date;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

const followUpConsultationSchema = new Schema<IFollowUpConsultation>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		doctorId: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
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
		scheduledTime: {
			type: Date,
			required: true,
		},
		priority: {
			type: String,
			enum: ["low", "medium", "high"],
			default: "medium",
		},
		location: {
			type: String,
			trim: true,
		},
		status: {
			type: String,
			enum: ["scheduled", "completed", "cancelled"],
			default: "scheduled",
		},
		completedAt: {
			type: Date,
		},
		notes: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true }
);

followUpConsultationSchema.index({ patientId: 1, scheduledTime: 1 });
followUpConsultationSchema.index({ doctorId: 1, scheduledTime: 1 });

const FollowUpConsultation: Model<IFollowUpConsultation> =
	mongoose.model<IFollowUpConsultation>(
		"FollowUpConsultation",
		followUpConsultationSchema
	);

export default FollowUpConsultation;

