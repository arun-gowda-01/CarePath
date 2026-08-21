import mongoose, { Document, Model } from "mongoose";
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
declare const Article: Model<IArticle>;
export default Article;
