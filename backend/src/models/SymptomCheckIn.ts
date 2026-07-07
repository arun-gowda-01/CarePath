import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISymptomCheckIn extends Document {
	patientId: mongoose.Types.ObjectId;
	painLevel: number;
	temperature: number;
	bloodPressure?: {
		systolic?: number;
		diastolic?: number;
		formatted?: string;
	};
	mood: "poor" | "okay" | "good" | "excellent";
	notes?: string;
	image?: {
		url?: string;
		filename?: string;
		uploadedAt?: Date;
	};
	symptoms?: Array<{
		type?: string;
		description?: string;
	}>;
	flaggedForReview: boolean;
	isRead: boolean;
	reviewedBy?: mongoose.Types.ObjectId;
	reviewedAt?: Date;
	checkInDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

const symptomCheckInSchema = new Schema<ISymptomCheckIn>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		painLevel: {
			type: Number,
			required: true,
			min: 0,
			max: 10,
		},
		temperature: {
			type: Number,
			required: true,
		},
		bloodPressure: {
			systolic: Number,
			diastolic: Number,
			formatted: String,
		},
		mood: {
			type: String,
			enum: ["poor", "okay", "good", "excellent"],
			required: true,
		},
		notes: {
			type: String,
			trim: true,
		},
		image: {
			url: String,
			filename: String,
			uploadedAt: Date,
		},
		symptoms: [
			{
				type: String,
				description: String,
			},
		],
		flaggedForReview: {
			type: Boolean,
			default: false,
		},
		isRead: {
			type: Boolean,
			default: false,
		},
		reviewedBy: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
		},
		reviewedAt: {
			type: Date,
		},
		checkInDate: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

symptomCheckInSchema.index({ patientId: 1, checkInDate: -1 });

const SymptomCheckIn: Model<ISymptomCheckIn> = mongoose.model<ISymptomCheckIn>(
	"SymptomCheckIn",
	symptomCheckInSchema
);

export default SymptomCheckIn;
