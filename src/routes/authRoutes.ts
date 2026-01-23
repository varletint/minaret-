import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate, asyncHandler } from "../middleware/index.js";
import {
  registerSchema,
  loginSchema,
  updateMosqueSchema,
  changePasswordSchema,
} from "../schemas/authSchema.js";
import * as authController from "../controllers/authController.js";

const router = Router();

// PATCH /api/v1/auth/profile - Update mosque profile
router.patch(
  "/profile",
  authenticate,
  validate(updateMosqueSchema),
  asyncHandler(authController.updateProfile)
);

// PATCH /api/v1/auth/password - Change password
router.patch(
  "/password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

// POST /api/v1/auth/register
router.post(
  "/register",

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
