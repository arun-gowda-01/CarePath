import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

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

const userSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: true,
			trim: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false,
		},
		role: {
			type: String,
			enum: ["patient", "doctor", "admin"],
			required: true,
		},
		lastLogin: {
			type: Date,
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
		},
		toObject: {
			virtuals: true,
		},
	}
);

userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

userSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.virtual("fullName").get(function (this: IUser) {
	return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("isActive").get(function (this: IUser) {
	return this.lastLogin
		? (Date.now() - this.lastLogin.getTime()) / (1000 * 60 * 60 * 24) <= 15 // Active if logged in within last 15 days
		: false;
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
