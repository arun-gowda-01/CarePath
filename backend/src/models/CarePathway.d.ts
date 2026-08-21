import mongoose, { Document, Model } from "mongoose";
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
declare const CarePathway: Model<ICarePathway>;
export default CarePathway;
