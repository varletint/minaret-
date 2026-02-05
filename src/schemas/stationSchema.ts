import { z } from "zod";

export const createStationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  settings: z
    .object({
      bitrate: z
        .enum(["64", "96", "128", "192", "256", "320"])
        .transform(Number)
        .optional(),
      format: z.enum(["mp3", "ogg", "aac"]).optional(),
      isPublic: z.boolean().optional(),
    })
    .optional(),
});

export const updateStationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  settings: z
    .object({
      bitrate: z
        .enum(["64", "96", "128", "192", "256", "320"])
        .transform(Number)
        .optional(),
      format: z.enum(["mp3", "ogg", "aac"]).optional(),
      isPublic: z.boolean().optional(),
    })
    .optional(),
});

export const updateNowPlayingSchema = z.object({
  title: z.string().max(200).optional(),
  artist: z.string().max(200).optional(),
  album: z.string().max(200).optional(),
});

export type CreateStationInput = z.infer<typeof createStationSchema>;
export type UpdateStationInput = z.infer<typeof updateStationSchema>;
export type UpdateNowPlayingInput = z.infer<typeof updateNowPlayingSchema>;
