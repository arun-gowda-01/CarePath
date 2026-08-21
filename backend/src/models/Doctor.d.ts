import mongoose, { Document, Model } from "mongoose";
export interface IDoctor extends Document {
    userId: mongoose.Types.ObjectId;
    role: "Surgeon" | "Cardiologist" | "Nurse" | "Care Coordinator" | "Physical Therapist" | "Anesthesiologist";
    phone?: string;
    specialization?: string;
    licenseNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const Doctor: Model<IDoctor>;
export default Doctor;
