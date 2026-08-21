import mongoose, { Document, Model } from "mongoose";
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
declare const SymptomCheckIn: Model<ISymptomCheckIn>;
export default SymptomCheckIn;
