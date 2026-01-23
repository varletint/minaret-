import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  id: string;
}

// Generate access token (short-lived)
export function generateAccessToken(mosqueId: string): string {
  return jwt.sign({ id: mosqueId } as TokenPayload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);
}

// Generate refresh token (long-lived)
export function generateRefreshToken(mosqueId: string): string {
  return jwt.sign({ id: mosqueId } as TokenPayload, env.jwtSecret, {
    expiresIn: env.refreshTokenExpiresIn,
  } as SignOptions);
}

// Verify refresh token
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

// Parse expiration time to milliseconds
export function parseExpirationToMs(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}
