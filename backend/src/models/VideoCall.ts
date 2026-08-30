import mongoose, { Document, Model, Schema } from "mongoose";

export interface IVideoCall extends Document {
	patientId: mongoose.Types.ObjectId;
	DoctorId: mongoose.Types.ObjectId;

	doctorUserId: mongoose.Types.ObjectId;
	patientUserId: mongoose.Types.ObjectId;

	roomId: string;

	startTime?: Date;
	endTime?: Date;

	duration?: number;

	status:
		| "scheduled"
		| "ringing"
		| "connected"
		| "completed"
		| "cancelled";

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

		doctorUserId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		patientUserId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		roomId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},

		startTime: {
			type: Date,
		},

		endTime: {
			type: Date,
		},

		duration: {
			type: Number,
			default: 0,
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
			default: "ringing",
			index: true,
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
	{
		timestamps: true,
	}
);

videoCallSchema.index({
	patientId: 1,
	startTime: -1,
});

videoCallSchema.index({
	DoctorId: 1,
	startTime: -1,
});

videoCallSchema.index({
	patientUserId: 1,
	status: 1,
});

videoCallSchema.index({
	doctorUserId: 1,
	status: 1,
});

const VideoCall: Model<IVideoCall> =
	mongoose.model<IVideoCall>(
		"VideoCall",
		videoCallSchema
	);

export default VideoCall;