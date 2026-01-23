import mongoose, { Schema, Document } from "mongoose";

export interface IShow extends Document {
  _id: mongoose.Types.ObjectId;
  stationId: mongoose.Types.ObjectId;
  mosqueId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  hostName?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  isRecurring: boolean;
  recurrence?: {
    pattern: "daily" | "weekly" | "monthly";
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
    dayOfMonth?: number;
  };
  isLive: boolean;
  actualStart?: Date;
  actualEnd?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const showSchema = new Schema<IShow>(
  {
    stationId: {
      type: Schema.Types.ObjectId,
      ref: "Station",
      required: [true, "Station ID is required"],
      index: true,
    },
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: "Mosque",
      required: [true, "Mosque ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Show title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    hostName: {
      type: String,
      trim: true,
      maxlength: [100, "Host name cannot exceed 100 characters"],
    },
    scheduledStart: {
      type: Date,
      required: [true, "Scheduled start time is required"],
    },
    scheduledEnd: {
      type: Date,
      required: [true, "Scheduled end time is required"],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      pattern: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
      daysOfWeek: [Number],
      dayOfMonth: Number,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    actualStart: Date,
    actualEnd: Date,
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate end time is after start time
showSchema.pre("validate", function () {
  if (this.scheduledEnd <= this.scheduledStart) {
    this.invalidate("scheduledEnd", "End time must be after start time");
  }
});

// Indexes for querying shows
showSchema.index({ stationId: 1, scheduledStart: 1 });
showSchema.index({ scheduledStart: 1, scheduledEnd: 1 });

export const Show = mongoose.model<IShow>("Show", showSchema);
