import mongoose, { Document, Model } from "mongoose";
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
declare const Message: Model<IMessage>;
export default Message;
