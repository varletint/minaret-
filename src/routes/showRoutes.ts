import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate, asyncHandler } from "../middleware/index.js";
import { createShowSchema, updateShowSchema } from "../schemas/showSchema.js";
import * as showController from "../controllers/showController.js";

const router = Router();

// GET /api/v1/shows/schedule/today - Today's schedule (must be before /:id)
router.get("/schedule/today", asyncHandler(showController.getTodaySchedule));

// GET /api/v1/shows/my - My shows (must be before /:id)
// 6970d3bfb6aaa807711eb371
router.get("/my", authenticate, asyncHandler(showController.getMyShows));

// POST /api/v1/shows - Create show
router.post(
  "/",
  authenticate,
  validate(createShowSchema),
  asyncHandler(showController.createShow)
);

// GET /api/v1/shows - List shows
router.get("/", asyncHandler(showController.listShows));

// GET /api/v1/shows/:id - Get show by ID
router.get("/:id", asyncHandler(showController.getShowById));

// PATCH /api/v1/shows/:id - Update show
router.patch(
  "/:id",
  authenticate,

  asyncHandler(showController.updateShow)
);

// DELETE /api/v1/shows/:id - Delete show
router.delete("/:id", authenticate, asyncHandler(showController.deleteShow));

// POST /api/v1/shows/:id/start - Start show
router.post("/:id/start", authenticate, asyncHandler(showController.startShow));

// POST /api/v1/shows/:id/end - End show
router.post("/:id/end", authenticate, asyncHandler(showController.endShow));

export default router;
