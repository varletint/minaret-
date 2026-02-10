import { Router } from "express";
import { authenticate, validate, asyncHandler } from "../middleware/index.js";
import { recordingCallbackSchema } from "../schemas/recordingSchema.js";
import {
  listRecordings,
  getRecording,
  getPlaybackUrls,
  getRecordingByShow,
  handleCallback,
  deleteRecording,
} from "../controllers/recordingController.js";

const router = Router();

// Public routes (for playback)
router.get("/:id", asyncHandler(getRecording));
router.get("/:id/playback", asyncHandler(getPlaybackUrls));
router.get("/show/:showId", asyncHandler(getRecordingByShow));

// Callback from VPS recording service (uses API key auth, not user auth)
router.post(
  "/callback",
  validate(recordingCallbackSchema),
  asyncHandler(handleCallback)
);

// Protected routes (mosque owner)
router.get("/", authenticate, asyncHandler(listRecordings));
router.delete("/:id", authenticate, asyncHandler(deleteRecording));

export default router;
