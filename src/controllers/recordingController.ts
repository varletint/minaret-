import { Request, Response } from "express";
import { Recording } from "../models/Recording.js";
import { Show } from "../models/Show.js";
import { NotFoundError, ForbiddenError } from "../middleware/index.js";
import {
  RecordingCallbackInput,
  listPublicRecordingsQuerySchema,
} from "../schemas/recordingSchema.js";
import mongoose, { isValidObjectId } from "mongoose";

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

  const parsedLimit = parseInt(limit as string, 10);

  const [recordings, total] = await Promise.all([
    Recording.find(query)
      .populate("showId", "title hostName")
      .sort({ createdAt: -1 })
      .limit(parsedLimit),
    Recording.countDocuments(query),
  ]);

  res.json({
    status: "success",
    results: recordings.length,
    total,
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

  // Auto-delete short recordings (e.g. < 1 min) to prevent clutter
  if (recording.status === "ready" && (recording.totalDurationSecs || 0) < 60) {
    await recording.deleteOne();
    console.log(
      `[Recording] Discarded short recording ${recording._id} (${recording.totalDurationSecs}s)`
    );
    res.json({
      status: "success",
      message: "Recording discarded (too short)",
    });
    return;
  }

  await recording.save();

  res.json({
    status: "success",
    message: "Callback received",
  });
}

// GET /api/v1/recordings/public - List all public recordings
export async function listPublicRecordings(
  req: Request,
  res: Response
): Promise<void> {
  const validationResult = listPublicRecordingsQuerySchema.safeParse(req.query);

  if (!validationResult.success) {
    res.status(400).json({
      status: "error",
      message: "Invalid query parameters",
      errors: validationResult.error.flatten(),
    });
    return;
  }

  const { limit, skip, stationId, mosqueId } = validationResult.data;

  const pipeline: any[] = [
    {
      $match: {
        status: "ready",
        ...(stationId
          ? { stationId: new mongoose.Types.ObjectId(stationId) }
          : {}),
        ...(mosqueId
          ? { mosqueId: new mongoose.Types.ObjectId(mosqueId) }
          : {}),
      },
    },
    {
      $lookup: {
        from: "shows",
        localField: "showId",
        foreignField: "_id",
        as: "show",
      },
    },
    { $unwind: "$show" },
    { $match: { "show.title": { $ne: "Live Stream" } } },

    // Sort and Paginate
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip || 0 },
          { $limit: limit || 20 },

          // Populate Station
          {
            $lookup: {
              from: "stations",
              localField: "stationId",
              foreignField: "_id",
              as: "station",
            },
          },
          { $unwind: { path: "$station", preserveNullAndEmptyArrays: true } },

          // Reshape to restore populated fields structure
          {
            $project: {
              _id: 1,
              status: 1,
              visibility: 1,
              chunks: 1,
              createdAt: 1,
              totalDurationSecs: 1,
              // Restore populated showId
              showId: {
                _id: "$show._id",
                title: "$show.title",
                hostName: "$show.hostName",
                scheduledStart: "$show.scheduledStart",
              },
              // Restore populated stationId
              stationId: {
                _id: "$station._id",
                name: "$station.name",
                slug: "$station.slug",
              },
              mosqueId: 1,
            },
          },
        ],
      },
    },
  ];

  const result = await Recording.aggregate(pipeline);

  const data = result[0].data;
  const total = result[0].metadata[0]?.total || 0;

  res.json({
    status: "success",
    results: data.length,
    total,
    data: { recordings: data },
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
