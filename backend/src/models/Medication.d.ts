import mongoose, { Document, Model } from "mongoose";
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
declare const Medication: Model<IMedication>;
export default Medication;
