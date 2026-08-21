import mongoose, { Document, Model } from "mongoose";
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
declare const FollowUpConsultation: Model<IFollowUpConsultation>;
export default FollowUpConsultation;
