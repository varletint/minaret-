import { z } from "zod";

// Register mosque validation
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  contactPhone: z.string().optional(),
});

// Login validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

// Update mosque profile
export const updateMosqueSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim()
    .optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
  contactPhone: z.string().optional(),
});

// Type exports for controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMosqueInput = z.infer<typeof updateMosqueSchema>;
