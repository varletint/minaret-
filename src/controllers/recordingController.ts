import { Request, Response } from "express";
import { Recording } from "../models/Recording.js";
import { Show } from "../models/Show.js";
import { NotFoundError, ForbiddenError } from "../middleware/index.js";
import { RecordingCallbackInput } from "../schemas/recordingSchema.js";

// GET /api/v1/recordings - List recordings for a mosque
export async function listRecordings(
  req: Request,
  res: Response
): Promise<void> {
  const mosqueId = req.mosqueId!;
  const { status, limit = "20" } = req.query;

  const query: Record<string, unknown> = { mosqueId };
  if (status) {
    query.status = status;
  }

  const recordings = await Recording.find(query)
    .populate("showId", "title hostName")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit as string, 10));

  res.json({
    status: "success",
    results: recordings.length,
    data: { recordings },
  });
}

// GET /api/v1/recordings/:id - Get single recording
export async function getRecording(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const recording = await Recording.findById(id)
    .populate("showId", "title hostName scheduledStart")
    .populate("stationId", "name slug");

  if (!recording) {
    throw NotFoundError("Recording not found");
  }

  res.json({
    status: "success",
    data: { recording },
  });
}

// GET /api/v1/recordings/:id/playback - Get playback URLs
export async function getPlaybackUrls(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;

  const recording = await Recording.findById(id);
  if (!recording) {
    throw NotFoundError("Recording not found");
  }

  if (recording.status !== "ready") {
    res.status(400).json({
      status: "error",
      message: `Recording is not ready. Current status: ${recording.status}`,
    });
    return;
  }

  const playbackUrls = recording.chunks.map((chunk) => ({
    index: chunk.index,
    url: chunk.publicUrl,
    codec: chunk.codec,
    durationSecs: chunk.durationSecs,
  }));

  res.json({
    status: "success",
    data: {
      recordingId: recording._id,
      totalDurationSecs: recording.totalDurationSecs,
      chunks: playbackUrls,
    },
  });
}

// GET /api/v1/recordings/show/:showId - Get recording for a show
export async function getRecordingByShow(
  req: Request,
  res: Response
): Promise<void> {
  const { showId } = req.params;

  const recording = await Recording.findOne({ showId, status: "ready" });

  if (!recording) {
    throw NotFoundError("No recording found for this show");
  }

  res.json({
    status: "success",
    data: { recording },
  });
}

// POST /api/v1/recordings/callback - Receive updates from VPS recording service
export async function handleCallback(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as RecordingCallbackInput;

  const recording = await Recording.findById(input.recordingId);
  if (!recording) {
    throw NotFoundError("Recording not found");
  }

  if (input.chunk) {
    recording.chunks.push({
      ...input.chunk,
      uploadedAt: new Date(),
    });
  }

  recording.status = input.status;

  if (input.endedAt) {
    recording.endedAt = new Date(input.endedAt);
  }

  if (input.totalDurationSecs) {
    recording.totalDurationSecs = input.totalDurationSecs;
  }

  if (input.error) {
    recording.error = input.error;
  }

  await recording.save();

  res.json({
    status: "success",
    message: "Callback received",
  });
}

// DELETE /api/v1/recordings/:id - Delete a recording
export async function deleteRecording(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const mosqueId = req.mosqueId!;

  const recording = await Recording.findById(id);
  if (!recording) {
    throw NotFoundError("Recording not found");
  }

  if (recording.mosqueId.toString() !== mosqueId) {
    throw ForbiddenError("You can only delete your own recordings");
  }

  await recording.deleteOne();

  res.json({
    status: "success",
    message: "Recording deleted",
  });
}
