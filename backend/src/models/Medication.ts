import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMedicationTiming {
	timeOfDay: "morning" | "afternoon" | "night";
}

export interface IDoseTaken {
	date: Date;
	timeOfDay: "morning" | "afternoon" | "night";
	takenAt: Date;
}

export interface IMedication extends Document {
	patientId: mongoose.Types.ObjectId;
	name: string;
	timings: IMedicationTiming[];
	foodRelation: "before" | "after" | "with" | "empty_stomach";
	startDate: Date;
	endDate?: Date;
	duration?: string;
	instructions?: string;
	sideEffects?: string[];
	adherenceRate: number;
	isActive: boolean;
	prescribedBy?: mongoose.Types.ObjectId;
	dosesTaken: IDoseTaken[];
	createdAt: Date;
	updatedAt: Date;
}

const medicationSchema = new Schema<IMedication>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		timings: [
			{
				timeOfDay: {
					type: String,
					enum: ["morning", "afternoon", "night"],
					required: true,
				},
			},
		],
		foodRelation: {
			type: String,
			enum: ["before", "after", "with", "empty_stomach"],
			required: true,
			default: "after",
		},
		startDate: {
			type: Date,
			required: true,
		},
		endDate: {
			type: Date,
		},
		duration: {
			type: String,
		},
		instructions: {
			type: String,
		},
		sideEffects: [String],
		adherenceRate: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		prescribedBy: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
		},
		dosesTaken: [
			{
				date: {
					type: Date,
					required: true,
				},
				timeOfDay: {
					type: String,
					enum: ["morning", "afternoon", "night"],
					required: true,
				},
				takenAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{ timestamps: true }
);

medicationSchema.index({ patientId: 1, isActive: 1 });

const Medication: Model<IMedication> = mongoose.model<IMedication>(
	"Medication",
	medicationSchema
);

export default Medication;
