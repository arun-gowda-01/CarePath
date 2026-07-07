import mongoose from "mongoose";

const connectDB = async (): Promise<typeof mongoose> => {
	try {
		const connection = await mongoose.connect(
			process.env.MONGODB_URI as string
		);
		console.log(`MongoDB Connected: ${connection.connection.host}`);
		return connection;
	} catch (error) {
		console.error("Error in DB connection", error);
		process.exit(1);
	}
};

export default connectDB;
