import mongoose, { Document, Model } from "mongoose";
export interface ITask extends Document {
    patientId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    type: "medication" | "exercise" | "check-in" | "appointment" | "wound-check" | "other";
    scheduledTime: Date;
    completed: boolean;
    completedAt?: Date;
    priority: "low" | "medium" | "high";
    medicationId?: mongoose.Types.ObjectId;
    exerciseId?: mongoose.Types.ObjectId;
    recurring?: {
        enabled?: boolean;
        frequency?: "daily" | "weekly" | "monthly";
        endDate?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const Task: Model<ITask>;
export default Task;
