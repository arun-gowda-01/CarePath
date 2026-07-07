import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAttachment {
	type?: string;
	url?: string;
	filename?: string;
}

export interface IMessage extends Document {
	conversationId: string;
	senderId: mongoose.Types.ObjectId;
	receiverId: mongoose.Types.ObjectId;
	senderType: "patient" | "Doctor";
	text: string;
	status: "sent" | "delivered" | "read";
	readAt?: Date;
	attachments?: IAttachment[];
	isSystemMessage: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
	{
		conversationId: {
			type: String,
			required: true,
			index: true,
		},
		senderId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		receiverId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		senderType: {
			type: String,
			enum: ["patient", "Doctor"],
			required: true,
		},
		text: {
			type: String,
			required: true,
			trim: true,
		},
		status: {
			type: String,
			enum: ["sent", "delivered", "read"],
			default: "sent",
		},
		readAt: {
			type: Date,
		},
		attachments: [
			{
				type: String,
				url: String,
				filename: String,
			},
		],
		isSystemMessage: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });

const Message: Model<IMessage> = mongoose.model<IMessage>(
	"Message",
	messageSchema
);

export default Message;
