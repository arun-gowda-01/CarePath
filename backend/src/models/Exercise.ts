import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExercise extends Document {
	exerciseDbId: string; // ExerciseDB API ID
	name: string;
	createdAt: Date;
	updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
	{
		exerciseDbId: {
			type: String,
			required: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
	},
	{ timestamps: true }
);

const Exercise: Model<IExercise> = mongoose.model<IExercise>(
	"Exercise",
	exerciseSchema
);

export default Exercise;
