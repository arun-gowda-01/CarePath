import mongoose, { Document, Model, Schema } from "mongoose";

export interface IReadHistory extends Document {
	patientId: mongoose.Types.ObjectId;
	articleId: mongoose.Types.ObjectId;
	readAt: Date;
	completionPercentage: number;
	timeSpent: number;
	createdAt: Date;
	updatedAt: Date;
}

const readHistorySchema = new Schema<IReadHistory>(
	{
		patientId: {
			type: Schema.Types.ObjectId,
			ref: "Patient",
			required: true,
		},
		articleId: {
			type: Schema.Types.ObjectId,
			ref: "Article",
			required: true,
		},
		readAt: {
			type: Date,
			default: Date.now,
		},
		completionPercentage: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		timeSpent: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

readHistorySchema.index({ patientId: 1, articleId: 1 }, { unique: true });

const ReadHistory: Model<IReadHistory> = mongoose.model<IReadHistory>(
	"ReadHistory",
	readHistorySchema
);

export default ReadHistory;
