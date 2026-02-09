import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  // Regex checks in code might be simpler to maintain or detailed error messages
  // but basic length is good for now.
  // For strict complexity: .regex(/[A-Z]/, ...).regex(/[0-9]/, ...)
});

export const updateMosqueStatusSchema = z.object({
  isActive: z.boolean(),
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventType: z
    .enum(["PAGE_VIEW", "PLAY_START", "PLAY_STOP", "DONATE_CLICK"])
    .optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
});
