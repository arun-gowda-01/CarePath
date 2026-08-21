import mongoose, { Document, Model } from "mongoose";
export interface IAssignment extends Document {
    patientId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    assignedDate: Date;
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
}
declare const Assignment: Model<IAssignment>;
export default Assignment;
