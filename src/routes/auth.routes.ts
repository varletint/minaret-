import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate, asyncHandler } from "../middleware/index.js";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// POST /api/v1/auth/register
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register)
);

// POST /api/v1/auth/login
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login)
);

// POST /api/v1/auth/refresh
router.post("/refresh", asyncHandler(authController.refresh));

// POST /api/v1/auth/logout
router.post("/logout", asyncHandler(authController.logout));

// GET /api/v1/me
router.get("/me", authenticate, asyncHandler(authController.getMe));

export default router;
