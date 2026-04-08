import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const mongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || "", {
      dbName: "cricItDB", 
    });

    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
};