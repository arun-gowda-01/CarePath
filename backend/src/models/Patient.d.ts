import mongoose, { Document, Model } from "mongoose";
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
declare const Patient: Model<IPatient>;
export default Patient;
