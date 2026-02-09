import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AdminJwtPayload {
  id: string;
  type: "admin";
  role: "super_admin" | "moderator";
}

export function generateAdminAccessToken(
  adminId: string,
  role: "super_admin" | "moderator"
): string {
  const payload: AdminJwtPayload = { id: adminId, type: "admin", role };

  return jwt.sign(payload, env.adminJwtSecret, {
    expiresIn: env.adminJwtExpiresIn,
  } as SignOptions);
}

export function generateAdminRefreshToken(
  adminId: string,
  role: "super_admin" | "moderator"
): string {
  const payload: AdminJwtPayload = { id: adminId, type: "admin", role };

  return jwt.sign(payload, env.adminJwtSecret, {
    expiresIn: env.adminRefreshTokenExpiresIn,
  } as SignOptions);
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  return jwt.verify(token, env.adminJwtSecret) as AdminJwtPayload;
}
