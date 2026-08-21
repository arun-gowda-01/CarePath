import mongoose, { Document, Model } from "mongoose";
export interface IAlertAction {
    action?: string;
    performedBy?: mongoose.Types.ObjectId;
    performedAt?: Date;
    notes?: string;
}
export interface IAlert extends Document {
    patientId: mongoose.Types.ObjectId;
    type: "High Fever" | "Severe Pain" | "Missed Medication" | "Low Adherence" | "Abnormal Vitals" | "Wound Concern" | "Check-in Completed" | "Other";
    severity: "normal" | "warning" | "critical";
    message: string;
    status: "active" | "resolved" | "dismissed";
    triggeredBy?: {
        source?: "symptom-checkin" | "medication" | "task" | "manual" | "system" | "doctor-review";
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
declare const Alert: Model<IAlert>;
export default Alert;
