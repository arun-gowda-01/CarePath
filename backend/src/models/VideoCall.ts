import mongoose, { Document, Model, Schema } from "mongoose";

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

const videoCallSchema = new Schema<IVideoCall>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		DoctorId: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
			required: true,
		},
		startTime: {
			type: Date,
			required: true,
		},
		endTime: {
			type: Date,
		},
		duration: {
			type: Number,
		},
		status: {
			type: String,
			enum: [
				"scheduled",
				"ringing",
				"connected",
				"completed",
				"cancelled",
			],
			default: "scheduled",
		},
		callType: {
			type: String,
			enum: ["video", "audio"],
			default: "video",
		},
		notes: {
			type: String,
			trim: true,
		},
	},
	{ timestamps: true }
);

videoCallSchema.index({ patientId: 1, startTime: -1 });
videoCallSchema.index({ DoctorId: 1, startTime: -1 });

const VideoCall: Model<IVideoCall> = mongoose.model<IVideoCall>(
	"VideoCall",
	videoCallSchema
);

export default VideoCall;
