import { Document, Model } from "mongoose";
export interface IUser extends Document {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: "patient" | "doctor" | "admin";
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    fullName: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const User: Model<IUser>;
export default User;
