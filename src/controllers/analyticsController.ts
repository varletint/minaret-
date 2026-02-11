import { Request, Response } from "express";
import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import { AnalyticsEvent, EventType } from "../models/Analytics.js";
import { TrackEventInput } from "../schemas/analyticsSchema.js";

const GEO_CACHE_MAX = 500;
const geoCache = new Map<
  string,
  {
    country: string;
    region: string;
    city: string;
    timezone: string;
    coordinates: [number, number];
  } | null
>();

async function lookupGeo(ip: string) {
  if (geoCache.has(ip)) return geoCache.get(ip)!;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,lat,lon`
    );
    const data = (await res.json()) as {
      status: string;
      country: string;
      regionName: string;
      city: string;
      timezone: string;
      lat: number;
      lon: number;
    };

    if (data.status === "success") {
      const geo = {
        country: data.country,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        coordinates: [data.lat, data.lon] as [number, number],
      };

      // Evict oldest entries if cache is full
      if (geoCache.size >= GEO_CACHE_MAX) {
        const firstKey = geoCache.keys().next().value!;
        geoCache.delete(firstKey);
      }
      geoCache.set(ip, geo);
      return geo;
    }
  } catch {
    // Silently fail — geo data is non-critical
  }

  geoCache.set(ip, null);
  return null;
}

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

  const geo = ipAddress ? await lookupGeo(ipAddress) : null;

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
          coordinates: geo.coordinates,
        }
      : undefined,
  });

  res.status(201).json({
    status: "success",
    message: "Event tracked",
  });
}
