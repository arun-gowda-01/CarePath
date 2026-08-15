import mongoose, { Document, Model, Schema } from "mongoose";

export interface IExercise extends Document {
    exerciseDbId: string;
    name: string;
    gifUrl: string;
    bodyParts: string[];
    equipments: string[];
    targetMuscles: string[];
    secondaryMuscles: string[];
    instructions: string[];
    createdAt: Date;
    updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
    {
        exerciseDbId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        gifUrl: {
            type: String,
            default: "",
        },

        bodyParts: {
            type: [String],
            default: [],
        },

        equipments: {
            type: [String],
            default: [],
        },

        targetMuscles: {
            type: [String],
            default: [],
        },

        secondaryMuscles: {
            type: [String],
            default: [],
        },

        instructions: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

const Exercise: Model<IExercise> = mongoose.model<IExercise>(
    "Exercise",
    exerciseSchema
);

export default Exercise;