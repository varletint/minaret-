import { Request, Response } from "express";
import { Mosque } from "../models/Mosque.js";
import { ConflictError, UnauthorizedError } from "../middleware/index.js";
import {
  RegisterInput,
  LoginInput,
  UpdateMosqueInput,
  ChangePasswordInput,
} from "../schemas/authSchema.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseExpirationToMs,
} from "../utils/jwt.js";
import { env } from "../config/env.js";

// POST /api/v1/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, location, contactPhone } =
    req.body as RegisterInput;

  const existingMosque = await Mosque.findOne({ email });
  if (existingMosque) {
    throw ConflictError("Email already registered");
  }

  const mosque = await Mosque.create({
    name,
    email,
    password,
    // location,
    contactPhone,
  });

  const accessToken = generateAccessToken(mosque._id.toString());
  const refreshToken = generateRefreshToken(mosque._id.toString());

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: parseExpirationToMs(env.refreshTokenExpiresIn),
    path: "/",
  });

  res.status(201).json({
    status: "success",
    data: {
      mosque: {
        id: mosque._id,
        name: mosque.name,
        email: mosque.email,
        slug: mosque.slug,
      },
      accessToken,
    },
  });
}

// POST /api/v1/auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;

  const mosque = await Mosque.findOne({ email }).select("+password");
  if (!mosque) {
    throw UnauthorizedError("Invalid credentials");
  }

  const isMatch = await mosque.comparePassword(password);
  if (!isMatch) {
    throw UnauthorizedError("Invalid credentials");
  }

  if (!mosque.isActive) {
    throw UnauthorizedError("Account is deactivated");
  }

  const accessToken = generateAccessToken(mosque._id.toString());
  const refreshToken = generateRefreshToken(mosque._id.toString());

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: parseExpirationToMs(env.refreshTokenExpiresIn),
    path: "/",
  });

  res.json({
    status: "success",
    data: {
      mosque: {
        id: mosque._id,
        name: mosque.name,
        email: mosque.email,
        slug: mosque.slug,
      },
      accessToken,
    },
  });
}

// POST /api/v1/auth/refresh
export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw UnauthorizedError("Refresh token not found");
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const mosque = await Mosque.findById(decoded.id);
    if (!mosque || !mosque.isActive) {
      throw UnauthorizedError("Invalid refresh token");
    }

    const accessToken = generateAccessToken(mosque._id.toString());

    res.json({
      status: "success",
      data: {
        accessToken,
      },
    });
  } catch {
    throw UnauthorizedError("Invalid refresh token");
  }
}

// POST /api/v1/auth/logout
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
  });

  res.json({
    status: "success",
    message: "Logged out successfully",
  });
}

// GET /api/v1/me
export async function getMe(req: Request, res: Response): Promise<void> {
  const mosque = req.mosque!;

  res.json({
    status: "success",
    data: {
      mosque: {
        id: mosque._id,
        name: mosque.name,
        email: mosque.email,
        slug: mosque.slug,
        location: mosque.location,
        contactPhone: mosque.contactPhone,
        isActive: mosque.isActive,
        createdAt: mosque.createdAt,
      },
    },
  });
}

// PATCH /api/v1/auth/profile
export async function updateProfile(
  req: Request,
  res: Response
): Promise<void> {
  const mosque = req.mosque!;
  const updates = req.body as UpdateMosqueInput;

  if (updates.name !== undefined) {
    mosque.name = updates.name;
    mosque.slug = updates.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (updates.location !== undefined) {
    mosque.location = updates.location;
  }
  if (updates.contactPhone !== undefined) {
    mosque.contactPhone = updates.contactPhone;
  }

  await mosque.save();

  res.json({
    status: "success",
    data: {
      mosque: {
        id: mosque._id,
        name: mosque.name,
        email: mosque.email,
        slug: mosque.slug,
        location: mosque.location,
        contactPhone: mosque.contactPhone,
        isActive: mosque.isActive,
        createdAt: mosque.createdAt,
      },
    },
  });
}

// PATCH /api/v1/auth/password
export async function changePassword(
  req: Request,
  res: Response
): Promise<void> {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;

  const mosque = await Mosque.findById(req.mosque!._id).select("+password");
  if (!mosque) {
    throw UnauthorizedError("Mosque not found");
  }

  const isMatch = await mosque.comparePassword(currentPassword);
  if (!isMatch) {
    throw UnauthorizedError("Current password is incorrect");
  }

  mosque.password = newPassword;
  await mosque.save();

  res.json({
    status: "success",
    message: "Password changed successfully",
  });
}
