import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDoctor extends Document {
	userId: mongoose.Types.ObjectId;
	role:
		| "Surgeon"
		| "Cardiologist"
		| "Nurse"
		| "Care Coordinator"
		| "Physical Therapist"
		| "Anesthesiologist";
	phone?: string;
	specialization?: string;
	licenseNumber?: string;
	createdAt: Date;
	updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		role: {
			type: String,
			required: true,
			enum: [
				"Surgeon",
				"Cardiologist",
				"Nurse",
				"Care Coordinator",
				"Physical Therapist",
				"Anesthesiologist",
			],
		},
		phone: {
			type: String,
			trim: true,
		},
		specialization: {
			type: String,
			trim: true,
		},
		licenseNumber: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true }
);

const Doctor: Model<IDoctor> = mongoose.model<IDoctor>("Doctor", doctorSchema);

export default Doctor;
