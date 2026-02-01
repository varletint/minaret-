import { Request, Response } from "express";
import { Station } from "../models/Station.js";
import { NotFoundError, ConflictError } from "../middleware/index.js";
import {
  CreateStationInput,
  UpdateStationInput,
  UpdateNowPlayingInput,
} from "../schemas/stationSchema.js";

// POST /api/v1/stations - Create a new station
export async function createStation(
  req: Request,
  res: Response
): Promise<void> {
  const mosqueId = req.mosqueId!;
  const { name, description, settings } = req.body as CreateStationInput;

  // Check if mosque already has a station
  const existingStation = await Station.findOne({ mosqueId });
  if (existingStation) {
    throw ConflictError("You already have a station. Update it instead.");
  }

  // Create station
  const station = await Station.create({
    mosqueId,
    name,
    description,
    settings: {
      bitrate: settings?.bitrate || 128,
      format: settings?.format || "mp3",
      isPublic: settings?.isPublic ?? true,
    },
  });

  res.status(201).json({
    status: "success",
    data: { station },
  });
}

// GET /api/v1/stations - List all public stations
export async function listStations(
  _req: Request,
  res: Response
): Promise<void> {
  const stations = await Station.find({ "settings.isPublic": true })
    .select(
      "name slug description isLive currentTrack streamUrl stats.totalListeners"
    )
    .populate("mosqueId", "name slug location")
    .sort({ "stats.totalListeners": -1 });

  res.json({
    status: "success",
    results: stations.length,
    data: { stations },
  });
}

// GET /api/v1/stations/live - List only live stations
export async function listLiveStations(
  _req: Request,
  res: Response
): Promise<void> {
  const stations = await Station.find({
    "settings.isPublic": true,
    isLive: true,
  })
    .select("name slug description isLive currentTrack stats.totalListeners")
    .populate("mosqueId", "name slug")
    .sort({ "stats.totalListeners": -1 });

  res.json({
    status: "success",
    results: stations.length,
    data: { stations },
  });
}

// GET /api/v1/stations/me - Get my station
export async function getMyStation(req: Request, res: Response): Promise<void> {
  const mosqueId = req.mosqueId!;

  const station = await Station.findOne({ mosqueId }).select(
    "+icecastCredentials.password"
  );
  if (!station) {
    throw NotFoundError("You do not have a station yet");
  }

  res.json({
    status: "success",
    data: { station },
  });
}

// GET /api/v1/stations/:slug - Get station by slug
export async function getStationBySlug(
  req: Request,
  res: Response
): Promise<void> {
  const { slug } = req.params;

  const station = await Station.findOne({ slug }).populate(
    "mosqueId",
    "name slug location"
  );
  if (!station) {
    throw NotFoundError("Station not found");
  }

  res.json({
    status: "success",
    data: { station },
  });
}

// PATCH /api/v1/stations/me - Update my station
export async function updateMyStation(
  req: Request,
  res: Response
): Promise<void> {
  const mosqueId = req.mosqueId!;
  const updates = req.body as UpdateStationInput;

  const station = await Station.findOne({ mosqueId });
  if (!station) {
    throw NotFoundError("You do not have a station yet");
  }

  // Apply updates
  if (updates.name) station.name = updates.name;
  if (updates.description !== undefined)
    station.description = updates.description;
  if (updates.settings) {
    if (updates.settings.bitrate)
      station.settings.bitrate = updates.settings.bitrate;
    if (updates.settings.format)
      station.settings.format = updates.settings.format;
    if (updates.settings.isPublic !== undefined)
      station.settings.isPublic = updates.settings.isPublic;
  }

  await station.save();

  res.json({
    status: "success",
    data: { station },
  });
}

// PATCH /api/v1/stations/me/now-playing - Update now playing
export async function updateNowPlaying(
  req: Request,
  res: Response
): Promise<void> {
  const mosqueId = req.mosqueId!;
  const { title, artist, album } = req.body as UpdateNowPlayingInput;

  const station = await Station.findOne({ mosqueId });
  if (!station) {
    throw NotFoundError("You do not have a station yet");
  }

  station.currentTrack = {
    title,
    artist,
    album,
    startedAt: new Date(),
  };

  await station.save();

  res.json({
    status: "success",
    data: { currentTrack: station.currentTrack },
  });
}

// POST /api/v1/stations/me/go-live - Start broadcasting
export async function goLive(req: Request, res: Response): Promise<void> {
  const mosqueId = req.mosqueId!;

  const station = await Station.findOne({ mosqueId }).select(
    "+icecastCredentials.password"
  );
  if (!station) {
    throw NotFoundError("You do not have a station yet");
  }

  // Build stream configuration
  const { env } = await import("../config/env.js");
  const icecastHost = "https://stream.saaminaret.shop";
  const icecastPort = env.icecast.port;
  const listenUrl = `http://${icecastHost}:${icecastPort}${station.mountPoint}`;

  if (!station.icecastCredentials?.password) {
    const crypto = await import("crypto");
    station.icecastCredentials = {
      username: `source_${station.slug}`,
      password: crypto.randomBytes(3).toString("hex"),
    };
  }

  if (station.streamUrl !== listenUrl) {
    station.streamUrl = listenUrl;
  }

  station.isLive = true;

  await station.save();

  res.json({
    status: "success",
    message: "Ready to broadcast. Connect with the credentials below.",
    data: {
      streamConfig: {
        server: icecastHost,
        port: icecastPort,
        mountPoint: station.mountPoint,
        username: station.icecastCredentials.username,
        password: station.icecastCredentials.password,
        format: station.settings.format,
        bitrate: station.settings.bitrate,
      },
      listenUrl: station.streamUrl,
      isLive: station.isLive,
    },
  });
}

// POST /api/v1/stations/me/go-offline - Stop broadcasting
export async function goOffline(req: Request, res: Response): Promise<void> {
  const mosqueId = req.mosqueId!;

  const station = await Station.findOne({ mosqueId });
  if (!station) {
    throw NotFoundError("You do not have a station yet");
  }

  station.isLive = false;
  station.currentTrack = undefined;
  await station.save();

  res.json({
    status: "success",
    message: "Station is now offline",
  });
}

// GET /api/v1/stations/:slug/now-playing - Get current track (public)
export async function getNowPlaying(
  req: Request,
  res: Response
): Promise<void> {
  const { slug } = req.params;

  const station = await Station.findOne({ slug }).select(
    "name isLive currentTrack"
  );
  if (!station) {
    throw NotFoundError("Station not found");
  }

  res.json({
    status: "success",
    data: {
      stationName: station.name,
      isLive: station.isLive,
      currentTrack: station.currentTrack,
    },
  });
}
