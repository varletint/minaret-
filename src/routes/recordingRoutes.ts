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
  listPublicRecordings,
} from "../controllers/recordingController.js";

const router = Router();

// Public routes (for playback)
// GET /api/v1/recordings/public - List all public recordings
router.get("/public", asyncHandler(listPublicRecordings));
// GET /api/v1/recordings/:id - Get single recording
router.get("/:id", asyncHandler(getRecording));
// GET /api/v1/recordings/:id/playback - Get playback URLs
router.get("/:id/playback", asyncHandler(getPlaybackUrls));
// GET /api/v1/recordings/show/:showId - Get recording for a show
router.get("/show/:showId", asyncHandler(getRecordingByShow));

// Callback from VPS recording service
// POST /api/v1/recordings/callback - Receive updates from VPS recording service
router.post(
  "/callback",
  validate(recordingCallbackSchema),
  asyncHandler(handleCallback)
);

// Protected routes (mosque owner)
// GET /api/v1/recordings - List recordings for a mosque
router.get("/", authenticate, asyncHandler(listRecordings));
// DELETE /api/v1/recordings/:id - Delete a recording
router.delete("/:id", authenticate, asyncHandler(deleteRecording));

export default router;
