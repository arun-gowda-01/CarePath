import mongoose, { Document, Model } from "mongoose";
export interface IVideoCall extends Document {
    patientId: mongoose.Types.ObjectId;
    DoctorId: mongoose.Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    status: "scheduled" | "ringing" | "connected" | "completed" | "cancelled";
    callType: "video" | "audio";
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const VideoCall: Model<IVideoCall>;
export default VideoCall;
