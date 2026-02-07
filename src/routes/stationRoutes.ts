import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate, asyncHandler } from "../middleware/index.js";
import {
  createStationSchema,
  updateStationSchema,
  updateNowPlayingSchema,
} from "../schemas/stationSchema.js";
import * as stationController from "../controllers/stationController.js";
import * as showController from "../controllers/showController.js";

const router = Router();

// POST /api/v1/stations
router.post(
  "/",
  authenticate,
  validate(createStationSchema),
  asyncHandler(stationController.createStation)
);

// GET /api/v1/stations
router.get("/", asyncHandler(stationController.listStations));

// GET /api/v1/stations/live
router.get("/live", asyncHandler(stationController.listLiveStations));

// GET /api/v1/stations/me
router.get("/me", authenticate, asyncHandler(stationController.getMyStation));

// GET /api/v1/stations/:slug - Get by slug
router.get("/:slug", asyncHandler(stationController.getStationBySlug));

// PATCH /api/v1/stations/me
router.patch(
  "/me",
  authenticate,
  validate(updateStationSchema),
  asyncHandler(stationController.updateMyStation)
);

// PATCH /api/v1/stations/me/now-playing - Update now playing
router.patch(
  "/me/now-playing",
  authenticate,
  validate(updateNowPlayingSchema),
  asyncHandler(stationController.updateNowPlaying)
);

// POST /api/v1/stations/me/go-live - Go live
router.post(
  "/me/go-live",
  authenticate,
  asyncHandler(stationController.goLive)
);

// POST /api/v1/stations/me/go-offline - Go offline
router.post(
  "/me/go-offline",
  authenticate,
  asyncHandler(stationController.goOffline)
);

// GET /api/v1/stations/:slug/now-playing - Get now playing (public)
router.get("/:slug/now-playing", asyncHandler(stationController.getNowPlaying));

// GET /api/v1/stations/:stationSlug/shows - Get shows by station slug
router.get(
  "/:stationSlug/shows",
  asyncHandler(showController.getShowsByStation)
);

export default router;
