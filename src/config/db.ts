import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err: Error) => {
  console.error("MongoDB error:", err);
});

export default mongoose;
