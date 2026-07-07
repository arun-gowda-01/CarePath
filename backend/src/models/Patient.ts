import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPatient extends Document {
	userId: mongoose.Types.ObjectId;
	dateOfBirth: Date;
	phone?: string;
	address?: {
		street?: string;
		city?: string;
		state?: string;
		zipCode?: string;
	};
	procedure: string;
	procedureDate: Date;
	carePathway?: mongoose.Types.ObjectId;
	riskLevel: "stable" | "monitor" | "critical";
	adherenceRate: number;
	recoveryProgress: number;
	monitoringDays: number;
	daysPostOp: number;
	status: "active" | "recovered" | "inactive";
	createdAt: Date;
	updatedAt: Date;
	age: number;
}

const patientSchema = new Schema<IPatient>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		dateOfBirth: {
			type: Date,
			required: true,
		},
		phone: {
			type: String,
			trim: true,
		},
		address: {
			street: String,
			city: String,
			state: String,
			zipCode: String,
		},
		procedure: {
			type: String,
			required: true,
		},
		procedureDate: {
			type: Date,
			required: true,
		},
		carePathway: {
			type: Schema.Types.ObjectId,
			ref: "CarePathway",
		},
		riskLevel: {
			type: String,
			enum: ["stable", "monitor", "critical"],
			default: "stable",
		},
		adherenceRate: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		recoveryProgress: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		monitoringDays: {
			type: Number,
			default: 7,
			min: 1,
		},
		status: {
			type: String,
			enum: ["active", "recovered"],
			default: "active",
		},
	},
	{ timestamps: true }
);

patientSchema.virtual("age").get(function (this: IPatient) {
	const today = new Date();
	const birthDate = new Date(this.dateOfBirth);
	let age = today.getFullYear() - birthDate.getFullYear();
	const monthDiff = today.getMonth() - birthDate.getMonth();
	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < birthDate.getDate())
	) {
		age--;
	}
	return age;
});

patientSchema.virtual("daysPostOp").get(function (this: IPatient) {
	const today = new Date();
	const procedureDate = new Date(this.procedureDate);
	const diffTime = Math.abs(today.getTime() - procedureDate.getTime());
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
});

const Patient: Model<IPatient> = mongoose.model<IPatient>(
	"Patient",
	patientSchema
);

export default Patient;
