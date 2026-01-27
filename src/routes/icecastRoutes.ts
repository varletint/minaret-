import { Router } from "express";
import { icecastAuthController } from "../controllers/icecastController";

const router = Router();

/**
 * Icecast API Routes
 * Mount these at /api/v1/icecast in your main app
 */

// Authentication endpoints
router.post("/source-auth", (req, res) =>
  icecastAuthController.sourceAuth(req, res)
);

router.post("/listener-auth", (req, res) =>
  icecastAuthController.listenerAuth(req, res)
);

// Event webhooks
router.post("/mount-add", (req, res) =>
  icecastAuthController.mountAdd(req, res)
);

router.post("/mount-remove", (req, res) =>
  icecastAuthController.mountRemove(req, res)
);

router.post("/listener-add", (req, res) =>
  icecastAuthController.listenerAdd(req, res)
);

router.post("/listener-remove", (req, res) =>
  icecastAuthController.listenerRemove(req, res)
);

export default router;
