import mongoose, { Document, Model } from "mongoose";
export interface INoteAttachment {
    filename?: string;
    url?: string;
    fileType?: string;
    uploadedAt?: Date;
}
export interface INote extends Document {
    patientId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    type: "Clinical" | "Progress" | "Intervention" | "Consultation" | "Discharge" | "Other";
    title?: string;
    content: string;
    priority: "low" | "medium" | "high";
    isPrivate: boolean;
    attachments?: INoteAttachment[];
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const Note: Model<INote>;
export default Note;
