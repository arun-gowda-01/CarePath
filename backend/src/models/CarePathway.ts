import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICarePathwayMilestone {
	day?: number;
	title?: string;
	description?: string;
	tasks?: string[];
}

export interface ICarePathwayCheckInQuestion {
	question?: string;
	type?: string;
	required?: boolean;
}

export interface ICarePathwayCheckInSchedule {
	day?: number;
	frequency?: string;
	questions?: ICarePathwayCheckInQuestion[];
}

export interface ICarePathwayMedicationProtocol {
	name?: string;
	dosage?: string;
	frequency?: string;
	startDay?: number;
	endDay?: number;
}

export interface ICarePathwayExerciseProtocol {
	name?: string;
	description?: string;
	startDay?: number;
	frequency?: string;
}

export interface ICarePathwayAlertThresholds {
	temperature?: number;
	painLevel?: number;
	adherenceRate?: number;
}

export interface ICarePathway extends Document {
	name: string;
	description?: string;
	procedureType: string;
	duration: number;
	status: "active" | "inactive" | "draft";
	milestones?: ICarePathwayMilestone[];
	checkInSchedule?: ICarePathwayCheckInSchedule[];
	medicationProtocol?: ICarePathwayMedicationProtocol[];
	exerciseProtocol?: ICarePathwayExerciseProtocol[];
	alertThresholds?: ICarePathwayAlertThresholds;
	educationalResources?: mongoose.Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const carePathwaySchema = new Schema<ICarePathway>(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		procedureType: {
			type: String,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			enum: ["active", "inactive", "draft"],
			default: "active",
		},
		milestones: [
			{
				day: Number,
				title: String,
				description: String,
				tasks: [String],
			},
		],
		checkInSchedule: [
			{
				day: Number,
				frequency: String,
				questions: [
					{
						question: String,
						type: String,
						required: Boolean,
					},
				],
			},
		],
		medicationProtocol: [
			{
				name: String,
				dosage: String,
				frequency: String,
				startDay: Number,
				endDay: Number,
			},
		],
		exerciseProtocol: [
			{
				name: String,
				description: String,
				startDay: Number,
				frequency: String,
			},
		],
		alertThresholds: {
			temperature: {
				type: Number,
				default: 100.4,
			},
			painLevel: {
				type: Number,
				default: 8,
			},
			adherenceRate: {
				type: Number,
				default: 70,
			},
		},
		educationalResources: [
			{
				type: Schema.Types.ObjectId,
				ref: "Article",
			},
		],
	},
	{ timestamps: true }
);

const CarePathway: Model<ICarePathway> = mongoose.model<ICarePathway>(
	"CarePathway",
	carePathwaySchema
);

export default CarePathway;
