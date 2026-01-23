import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { BadRequestError } from "./errorHandler.js";

// Validate request body, query, or params using Zod schema
export function validate(
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated; // Replace with validated/transformed data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        throw BadRequestError(messages.join(", "));
      }
      throw error;
    }
  };
}

// Sanitize string inputs (trim whitespace, etc.)
export function sanitizeBody(fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.body) {
      for (const field of fields) {
        if (typeof req.body[field] === "string") {
          req.body[field] = req.body[field].trim();
        }
      }
    }
    next();
  };
}
