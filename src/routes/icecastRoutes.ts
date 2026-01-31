import { Router } from "express";
import { icecastAuthController } from "../controllers/icecastController";
import { asyncHandler } from "../middleware/index.js";

const router = Router();

// /api/v1/icecast/

router.post("/source-auth", asyncHandler(icecastAuthController.sourceAuth));

// router.post("/listener-auth", asyncHandler(icecastAuthController.listenerAuth));

router.post("/mount_add", asyncHandler(icecastAuthController.mountAdd));

router.post("/mount_remove", asyncHandler(icecastAuthController.mountRemove));

router.post("/listener-add", asyncHandler(icecastAuthController.listenerAdd));

router.post(
  "/listener_remove",
  asyncHandler(icecastAuthController.listenerRemove)
);

export default router;
