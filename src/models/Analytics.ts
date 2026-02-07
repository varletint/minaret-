import mongoose, { Schema, Document } from "mongoose";

export type EventType = "PAGE_VIEW" | "PLAY_START" | "PLAY_STOP";

export interface IAnalyticsEvent extends Document {
  _id: mongoose.Types.ObjectId;
  eventType: EventType;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  metadata: Record<string, any>;
  userAgent?: string;
  device?: {
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    deviceType?: string;
    deviceVendor?: string;
    deviceModel?: string;
  };
  ipAddress?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    coordinates?: [number, number];
  };
  createdAt: Date;
}

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: ["PAGE_VIEW", "PLAY_START", "PLAY_STOP"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Mosque",
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    userAgent: {
      type: String,
    },
    device: {
      browser: String,
      browserVersion: String,
      os: String,
      osVersion: String,
      deviceType: String,
      deviceVendor: String,
      deviceModel: String,
    },
    ipAddress: {
      type: String,
    },
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String,
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ eventType: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>(
  "AnalyticsEvent",
  analyticsEventSchema
);
