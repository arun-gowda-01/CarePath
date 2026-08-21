import mongoose, { Document, Model } from "mongoose";
export interface IReadHistory extends Document {
    patientId: mongoose.Types.ObjectId;
    articleId: mongoose.Types.ObjectId;
    readAt: Date;
    completionPercentage: number;
    timeSpent: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const ReadHistory: Model<IReadHistory>;
export default ReadHistory;
