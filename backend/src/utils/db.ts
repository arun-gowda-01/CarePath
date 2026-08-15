import mongoose from "mongoose";

const connectDB = async (): Promise<typeof mongoose> => {
    const maxRetries = 5;
    const retryDelay = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const connection = await mongoose.connect(
                process.env.MONGODB_URI as string,
                {
                    serverSelectionTimeoutMS: 10000,
                    connectTimeoutMS: 10000,
                }
            );

            console.log(
                `MongoDB Connected: ${connection.connection.host}`
            );

            return connection;
        } catch (error) {
            console.error(
                `MongoDB connection attempt ${attempt}/${maxRetries} failed`
            );

            if (attempt === maxRetries) {
                console.error(
                    "Could not connect to MongoDB after multiple attempts."
                );

                throw error;
            }

            console.log(
                `Retrying MongoDB connection in ${retryDelay / 1000} seconds...`
            );

            await new Promise((resolve) =>
                setTimeout(resolve, retryDelay)
            );
        }
    }

    throw new Error("MongoDB connection failed");
};

export default connectDB;