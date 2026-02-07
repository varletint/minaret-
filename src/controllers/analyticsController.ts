import { Request, Response } from "express";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import { AnalyticsEvent, EventType } from "../models/Analytics.js";
import { TrackEventInput } from "../schemas/analyticsSchema.js";

export async function trackEvent(req: Request, res: Response): Promise<void> {
  const { type, payload } = req.body as TrackEventInput;
  const userId = req.mosqueId;
  const userAgentString = req.headers["user-agent"];
  const ipAddress =
    req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
    req.socket.remoteAddress;

  let sessionId =
    req.cookies?.sessionId || req.headers["x-session-id"]?.toString();

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }

  const parser = new UAParser(userAgentString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const deviceInfo = parser.getDevice();

  const geo = ipAddress ? geoip.lookup(ipAddress) : null;

  await AnalyticsEvent.create({
    eventType: type as EventType,
    userId: userId || undefined,
    sessionId,
    metadata: payload || {},
    userAgent: userAgentString,
    device: {
      browser: browser.name,
      browserVersion: browser.version,
      os: os.name,
      osVersion: os.version,
      deviceType: deviceInfo.type || "desktop",
      deviceVendor: deviceInfo.vendor,
      deviceModel: deviceInfo.model,
    },
    ipAddress,
    location: geo
      ? {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          timezone: geo.timezone,
          coordinates: geo.ll,
        }
      : undefined,
  });

  res.status(201).json({
    status: "success",
    message: "Event tracked",
  });
}
