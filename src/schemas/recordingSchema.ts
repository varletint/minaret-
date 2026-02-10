import { z } from "zod";

export const recordingCallbackSchema = z.object({
  recordingId: z.string(),
  status: z.enum(["recording", "processing", "ready", "failed"]),
  chunk: z
    .object({
      index: z.number(),
      filename: z.string(),
      storagePath: z.string(),
      publicUrl: z.string(),
      codec: z.enum(["mp3", "aac"]),
      durationSecs: z.number().optional(),
      sizeBytes: z.number().optional(),
    })
    .optional(),
  error: z.string().optional(),
  endedAt: z.string().optional(),
  totalDurationSecs: z.number().optional(),
});

export type RecordingCallbackInput = z.infer<typeof recordingCallbackSchema>;
