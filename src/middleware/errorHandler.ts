import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const BadRequestError = (message: string) => new ApiError(400, message);
export const UnauthorizedError = (message: string) =>
  new ApiError(401, message);
export const ForbiddenError = (message: string) => new ApiError(403, message);
export const NotFoundError = (message: string) => new ApiError(404, message);
export const ConflictError = (message: string) => new ApiError(409, message);

export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = "Internal server error";
  let stack: string | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = err.message;
  } else if (err.name === "CastError") {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400;
    message = "Invalid ID format";
  } else if ((err as { code?: number }).code === 11000) {
    // Mongoose duplicate key error
    statusCode = 409;
    message = "Duplicate entry exists";
  } else {
    message =
      env.nodeEnv === "development" ? err.message : "Internal server error";
  }

  if (env.nodeEnv === "development") {
    stack = err.stack;
  }

  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  if (stack) console.error(stack);

  res.status(statusCode).json({
    status: "error",
    message,
    ...(stack && { stack }),
  });
}

export function asyncHandler(
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void | Response>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
