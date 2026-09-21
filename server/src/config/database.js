import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`Mongodb connected: ${connection.connection.host}`);
  } catch (error) {
    console.log("MongoDB failed to connect: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
