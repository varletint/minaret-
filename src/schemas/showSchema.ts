import { z } from "zod";

// Create show validation
export const createShowSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  hostName: z
    .string()
    .max(100, "Host name cannot exceed 100 characters")
    .optional(),
  scheduledStart: z
    .string()
    .datetime({ message: "Invalid start date/time format" }),
  scheduledEnd: z
    .string()
    .datetime({ message: "Invalid end date/time format" }),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .object({
      pattern: z.enum(["daily", "weekly", "monthly"]),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
    })
    .optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Update show validation
export const updateShowSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title cannot exceed 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  hostName: z
    .string()
    .max(100, "Host name cannot exceed 100 characters")
    .optional(),
  scheduledStart: z
    .string()
    .datetime({ message: "Invalid start date/time format" })
    .optional(),
  scheduledEnd: z
    .string()
    .datetime({ message: "Invalid end date/time format" })
    .optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z
    .object({
      pattern: z.enum(["daily", "weekly", "monthly"]),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
    })
    .optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreateShowInput = z.infer<typeof createShowSchema>;
export type UpdateShowInput = z.infer<typeof updateShowSchema>;
