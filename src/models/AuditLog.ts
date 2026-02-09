import mongoose, { Document, Schema } from "mongoose";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "MOSQUE_ACTIVATED"
  | "MOSQUE_DEACTIVATED"
  | "ADMIN_CREATED"
  | "ADMIN_DEACTIVATED";

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: AuditAction;
  targetType?: "mosque" | "station" | "show" | "admin";
  targetId?: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    action: {
      type: String,
      enum: [
        "LOGIN",
        "LOGOUT",
        "LOGIN_FAILED",
        "PASSWORD_CHANGED",
        "MOSQUE_ACTIVATED",
        "MOSQUE_DEACTIVATED",
        "ADMIN_CREATED",
        "ADMIN_DEACTIVATED",
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["mosque", "station", "show", "admin"],
    },
    targetId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String, required: true },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Only need creation time for logs
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
