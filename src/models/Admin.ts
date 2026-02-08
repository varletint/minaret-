import mongoose, { Document, Schema } from "mongoose";

export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: "super_admin" | "moderator";
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["super_admin", "moderator"],
      default: "moderator",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const Admin = mongoose.model<IAdmin>("Admin", adminSchema);
