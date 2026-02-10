import { Request, Response } from "express";
import { Show } from "../models/Show.js";
import { Station } from "../models/Station.js";
import { NotFoundError, ForbiddenError } from "../middleware/index.js";
import { CreateShowInput, UpdateShowInput } from "../schemas/showSchema.js";
import {
  triggerRecordingStart,
  triggerRecordingStop,
} from "../services/recordingService.js";

// POST /api/v1/shows - Create a new show
export async function createShow(req: Request, res: Response): Promise<void> {
  const mosqueId = req.mosqueId!;
  const input = req.body as CreateShowInput;

  const station = await Station.findOne({ mosqueId });
  if (!station) {
    throw NotFoundError("You must create a station first");
  }

  const show = await Show.create({
    stationId: station._id,
    mosqueId,
    title: input.title,
    description: input.description,
    hostName: input.hostName,
    scheduledStart: new Date(input.scheduledStart),
    scheduledEnd: new Date(input.scheduledEnd),
    isRecurring: input.isRecurring || false,
    recurrence: input.recurrence,
    tags: input.tags || [],
  });

  res.status(201).json({
    status: "success",
    data: { show },
  });
}

// GET /api/v1/shows - Get all shows
export async function listShows(req: Request, res: Response): Promise<void> {
  const { stationSlug, upcoming, limit = "20" } = req.query;

  const query: Record<string, unknown> = {};

  if (stationSlug) {
    const station = await Station.findOne({ slug: stationSlug as string });
    if (station) {
      query.stationId = station._id;
    }
  }

  if (upcoming === "true") {
    query.scheduledStart = { $gte: new Date() };
  }

  const shows = await Show.find(query)
    .populate("stationId", "name slug")
    .sort({ scheduledStart: 1 })
    .limit(parseInt(limit as string, 10));

  res.json({
    status: "success",
    results: shows.length,
    data: { shows },
  });
}

// GET /api/v1/stations/:stationSlug/shows - Get shows by station slug
export async function getShowsByStation(
  req: Request,
  res: Response
): Promise<void> {
  const { stationSlug } = req.params;

  const station = await Station.findOne({ slug: stationSlug });
  if (!station) {
    throw NotFoundError("Station not found");
  }

  const shows = await Show.find({ stationId: station._id })
    .populate("stationId", "name slug")
    .sort({ scheduledStart: 1 });

  res.json({
    success: true,
    data: { shows },
  });
}

// GET /api/v1/shows/my - Get my shows
export async function getMyShows(req: Request, res: Response): Promise<void> {
  const mosqueId = req.mosqueId!;

  const shows = await Show.find({ mosqueId })
    .sort({ scheduledStart: -1 })
    .limit(50);

  res.json({
    status: "success",
    results: shows.length,
    data: { shows },
  });
}

// GET /api/v1/shows/:id - Get show by ID
export async function getShowById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const show = await Show.findById(id)
    .populate("stationId", "name slug")
    .populate("mosqueId", "name");

  if (!show) {
    throw NotFoundError("Show not found");
  }

  res.json({
    status: "success",
    data: { show },
  });
}

// PATCH /api/v1/shows/:id - Update show
export async function updateShow(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const mosqueId = req.mosqueId!;
  const updates = req.body as UpdateShowInput;

  const show = await Show.findById(id);
  if (!show) {
    throw NotFoundError("Show not found");
  }

  if (show.mosqueId.toString() !== mosqueId) {
    throw ForbiddenError("You can only update your own shows");
  }

  if (updates.title) show.title = updates.title;
  if (updates.description !== undefined) show.description = updates.description;
  if (updates.hostName !== undefined) show.hostName = updates.hostName;
  if (updates.scheduledStart)
    show.scheduledStart = new Date(updates.scheduledStart);
  if (updates.scheduledEnd) show.scheduledEnd = new Date(updates.scheduledEnd);
  if (updates.isRecurring !== undefined) show.isRecurring = updates.isRecurring;
  if (updates.recurrence) {
    show.recurrence = {
      pattern: updates.recurrence.pattern || show.recurrence?.pattern,
      daysOfWeek: updates.recurrence.daysOfWeek || [],
      dayOfMonth: updates.recurrence.dayOfMonth,
    };
  }
  if (updates.tags) show.tags = updates.tags;
  console.log(show.recurrence);

  await show.save();

  res.json({
    status: "success",
    data: { show },
  });
}

// DELETE /api/v1/shows/:id - Delete show
export async function deleteShow(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const mosqueId = req.mosqueId!;

  const show = await Show.findById(id);
  if (!show) {
    throw NotFoundError("Show not found");
  }

  if (show.mosqueId.toString() !== mosqueId) {
    throw ForbiddenError("You can only delete your own shows");
  }

  await show.deleteOne();

  res.json({
    status: "success",
    message: "Show deleted successfully",
  });
}

// POST /api/v1/shows/:id/start - Start show
export async function startShow(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const mosqueId = req.mosqueId!;

  const show = await Show.findById(id);
  if (!show) {
    throw NotFoundError("Show not found");
  }

  if (show.mosqueId.toString() !== mosqueId) {
    throw ForbiddenError("You can only start your own shows");
  }

  show.isLive = true;
  show.actualStart = new Date();

  const station = await Station.findById(show.stationId);
  if (!station) {
    throw NotFoundError("Station not found");
  }

  if (show.recording?.isEnabled !== false) {
    try {
      const recordingId = await triggerRecordingStart({ show, station });
      show.recording = {
        isEnabled: true,
        recordingId: new (await import("mongoose")).Types.ObjectId(recordingId),
      };
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }

  await show.save();

  await Station.findByIdAndUpdate(show.stationId, {
    isLive: true,
    currentTrack: {
      title: show.title,
      artist: show.hostName,
      startedAt: new Date(),
    },
  });

  res.json({
    status: "success",
    message: "Show started",
    data: { show },
  });
}

// POST /api/v1/shows/:id/end - End show
export async function endShow(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const mosqueId = req.mosqueId!;

  const show = await Show.findById(id);
  if (!show) {
    throw NotFoundError("Show not found");
  }

  if (show.mosqueId.toString() !== mosqueId) {
    throw ForbiddenError("You can only end your own shows");
  }

  show.isLive = false;
  show.actualEnd = new Date();

  // Stop recording if active
  if (show.recording?.recordingId) {
    try {
      await triggerRecordingStop(show.recording.recordingId.toString());
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  }

  await show.save();

  await Station.findByIdAndUpdate(show.stationId, {
    isLive: false,
    currentTrack: undefined,
  });

  res.json({
    status: "success",
    message: "Show ended",
    data: { show },
  });
}

// GET /api/v1/shows/schedule/today - Get today's schedule
export async function getTodaySchedule(
  req: Request,
  res: Response
): Promise<void> {
  const { stationSlug } = req.query;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const query: Record<string, unknown> = {
    scheduledStart: { $gte: startOfDay, $lte: endOfDay },
  };

  if (stationSlug) {
    const station = await Station.findOne({ slug: stationSlug as string });
    if (station) {
      query.stationId = station._id;
    }
  }

  const shows = await Show.find(query)
    .populate("stationId", "name slug")
    .sort({ scheduledStart: 1 });

  res.json({
    status: "success",
    results: shows.length,
    data: { shows },
  });
}
