import { Request, Response } from "express";
import { Station } from "../models/Station.js";
import { Show } from "../models/Show.js";

interface SearchQuery {
  q?: string;
  type?: string;
  page?: string;
  limit?: string;
}

// GET /api/v1/search
export async function search(req: Request, res: Response): Promise<void> {
  const {
    q,
    type = "all",
    page = "1",
    limit = "10",
  } = req.query as SearchQuery;

  if (!q || q.trim().length === 0) {
    res.json({
      status: "success",
      data: {
        stations: [],
        shows: [],
        pagination: {
          page: 1,
          limit: parseInt(limit, 10),
          total: 0,
          totalPages: 0,
        },
      },
    });
    return;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Create case-insensitive regex for search
  const searchRegex = new RegExp(q.trim(), "i");

  const types = type
    .toLowerCase()
    .split(",")
    .map((t) => t.trim());
  const searchAll = types.includes("all");
  const searchStations = searchAll || types.includes("stations");
  const searchShows = searchAll || types.includes("shows");

  let stations: (typeof Station.prototype)[] = [];
  let shows: (typeof Show.prototype)[] = [];
  let totalStations = 0;
  let totalShows = 0;

  // Search stations
  if (searchStations) {
    const stationQuery = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { "currentTrack.title": searchRegex },
      ],
      "settings.isPublic": true,
    };

    [stations, totalStations] = await Promise.all([
      Station.find(stationQuery)
        .select(
          "name slug description isLive currentTrack settings.format createdAt"
        )
        .populate("mosqueId", "name slug")
        .skip(skip)
        .limit(limitNum)
        .sort({ isLive: -1, name: 1 }),
      Station.countDocuments(stationQuery),
    ]);
  }

  // Search Shows
  if (searchShows) {
    const showQuery = {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { hostName: searchRegex },
        { tags: searchRegex },
      ],
    };

    [shows, totalShows] = await Promise.all([
      Show.find(showQuery)
        .select(
          "title description hostName scheduledStart scheduledEnd isLive tags"
        )
        .populate("stationId", "name slug")
        .skip(skip)
        .limit(limitNum)
        .sort({ scheduledStart: -1 }),
      Show.countDocuments(showQuery),
    ]);
  }

  const total = totalStations + totalShows;

  res.json({
    status: "success",
    data: {
      stations,
      shows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
}
