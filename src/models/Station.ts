import mongoose, { Schema, Document } from "mongoose";

export interface IStation extends Document {
  _id: mongoose.Types.ObjectId;
  mosqueId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  streamUrl?: string;
  mountPoint: string;
  isLive: boolean;
  currentTrack?: {
    title?: string;
    artist?: string;
    album?: string;
    startedAt?: Date;
  };
  settings: {
    bitrate: number;
    format: "mp3" | "ogg" | "aac";
    isPublic: boolean;
  };
  stats: {
    totalListeners: number;
    peakListeners: number;
    totalBroadcastMinutes: number;
  };
  icecastCredentials?: {
    username: string;
    password: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const stationSchema = new Schema<IStation>(
  {
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: "Mosque",
      required: [true, "Mosque ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Station name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    streamUrl: {
      type: String,
      trim: true,
    },
    mountPoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    currentTrack: {
      title: String,
      artist: String,
      album: String,
      startedAt: Date,
    },
    settings: {
      bitrate: {
        type: Number,
        default: 128,
        enum: [64, 96, 128, 192, 256, 320],
      },
      format: {
        type: String,
        default: "mp3",
        enum: ["mp3", "ogg", "aac"],
      },
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
    stats: {
      totalListeners: {
        type: Number,
        default: 0,
      },
      peakListeners: {
        type: Number,
        default: 0,
      },
      totalBroadcastMinutes: {
        type: Number,
        default: 0,
      },
    },
    icecastCredentials: {
      username: String,
      password: {
        type: String,
        select: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug and mount point before validation
stationSchema.pre("validate", function () {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Generate mount point from slug if not set
  if (!this.mountPoint && this.slug) {
    this.mountPoint = `/${this.slug}`;
  }
});

stationSchema.index({ mosqueId: 1, slug: 1 });

export const Station = mongoose.model<IStation>("Station", stationSchema);
