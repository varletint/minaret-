import { z } from "zod";

export const trackEventSchema = z.object({
  type: z.enum(["PAGE_VIEW", "PLAY_START", "PLAY_STOP"]),
  payload: z
    .object({
      stationId: z.string().optional(),
      path: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;
