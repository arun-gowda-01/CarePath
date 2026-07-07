import mongoose, { Document, Model, Schema } from "mongoose";

export interface IArticle extends Document {
	title: string;
	description: string;
	content: string;
	category: "Recovery" | "Medications" | "Safety" | "Wellness" | "Nutrition";
	duration: string;
	author?: mongoose.Types.ObjectId;
	tags?: string[];
	imageUrl?: string;
	videoUrl?: string;
	relatedArticles?: mongoose.Types.ObjectId[];
	readCount: number;
	isPublished: boolean;
	publishedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		category: {
			type: String,
			required: true,
			enum: [
				"Recovery",
				"Medications",
				"Safety",
				"Wellness",
				"Nutrition",
			],
		},
		duration: {
			type: String,
			required: true,
		},
		author: {
			type: Schema.Types.ObjectId,
			ref: "Doctor",
		},
		tags: [String],
		imageUrl: {
			type: String,
		},
		videoUrl: {
			type: String,
		},
		relatedArticles: [
			{
				type: Schema.Types.ObjectId,
				ref: "Article",
			},
		],
		readCount: {
			type: Number,
			default: 0,
		},
		isPublished: {
			type: Boolean,
			default: true,
		},
		publishedAt: {
			type: Date,
		},
	},
	{ timestamps: true }
);

articleSchema.index({ category: 1, isPublished: 1 });

const Article: Model<IArticle> = mongoose.model<IArticle>(
	"Article",
	articleSchema
);

export default Article;
