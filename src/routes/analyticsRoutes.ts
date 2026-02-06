import { Router } from "express";
import asyncHandler from "express-async-handler";
import { trackEvent } from "../controllers/analyticsController.js";
import { validate } from "../middleware/index.js";
import { trackEventSchema } from "../schemas/analyticsSchema.js";

const router = Router();

router.post("/events", validate(trackEventSchema), asyncHandler(trackEvent));

export default router;
