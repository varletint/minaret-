import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Mosque, IMosque } from "../models/Mosque.js";
import { UnauthorizedError } from "./errorHandler.js";

// Extend Express Request to include mosque
declare global {
  namespace Express {
    interface Request {
      mosque?: IMosque;
      mosqueId?: string;
    }
  }
}

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

// Authenticate JWT token
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      throw UnauthorizedError("Access token required");
    }

    // Verify token
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    // Get mosque from database
    const mosque = await Mosque.findById(decoded.id);
    if (!mosque) {
      throw UnauthorizedError("Mosque not found");
    }

    if (!mosque.isActive) {
      throw UnauthorizedError("Account is deactivated");
    }

    // Attach mosque to request
    req.mosque = mosque;
    req.mosqueId = decoded.id;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(UnauthorizedError("Invalid token"));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(UnauthorizedError("Token expired"));
    } else {
      next(error);
    }
  }
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
      const mosque = await Mosque.findById(decoded.id);
      if (mosque && mosque.isActive) {
        req.mosque = mosque;
        req.mosqueId = decoded.id;
      }
    }
    next();
  } catch {
    // Silently continue without auth
    next();
  }
}
