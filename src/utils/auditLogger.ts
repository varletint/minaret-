import { Request } from "express";
import { AuditLog, AuditAction } from "../models/AuditLog.js";

interface LogAuditParams {
  adminId: string;
  action: AuditAction;
  req: Request;
  targetType?: "mosque" | "station" | "show" | "admin";
  targetId?: string;
  details?: Record<string, unknown>;
}

export async function logAuditEvent({
  adminId,
  action,
  req,
  targetType,
  targetId,
  details,
}: LogAuditParams): Promise<void> {
  try {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await AuditLog.create({
      adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress, // In production behind proxy, might need req.headers['x-forwarded-for']
      userAgent,
    });
  } catch (error) {
    // Fail silently to not block the main request flow, but log to console
    console.error("Failed to log audit event:", error);
  }
}
