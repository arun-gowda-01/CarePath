import { Document, Model } from "mongoose";
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
declare const Exercise: Model<IExercise>;
export default Exercise;
