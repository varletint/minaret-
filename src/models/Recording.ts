import mongoose, { Schema, Document } from "mongoose";

export interface IRecordingChunk {
  index: number;
  filename: string;
  storagePath: string;
  publicUrl: string;
  codec: "mp3" | "aac";
  durationSecs?: number;
  sizeBytes?: number;
  uploadedAt: Date;
}

export interface IRecording extends Document {
  _id: mongoose.Types.ObjectId;
  showId: mongoose.Types.ObjectId;
  stationId: mongoose.Types.ObjectId;
  mosqueId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  hostName?: string;
  status: "pending" | "recording" | "processing" | "ready" | "failed";
  visibility: "public" | "private";
  chunks: IRecordingChunk[];
  startedAt?: Date;
  endedAt?: Date;
  totalDurationSecs?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recordingChunkSchema = new Schema<IRecordingChunk>(
  {
    index: { type: Number, required: true },
    filename: { type: String, required: true },
    storagePath: { type: String, required: true },
    publicUrl: { type: String, required: true },
    codec: { type: String, enum: ["mp3", "aac"], required: true },
    durationSecs: Number,
    sizeBytes: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const recordingSchema = new Schema<IRecording>(
  {
    showId: {
      type: Schema.Types.ObjectId,
      ref: "Show",
      required: true,
      index: true,
    },
    stationId: {
      type: Schema.Types.ObjectId,
      ref: "Station",
      required: true,
      index: true,
    },
    mosqueId: {
      type: Schema.Types.ObjectId,
      ref: "Mosque",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    hostName: String,
    status: {
      type: String,
      enum: ["pending", "recording", "processing", "ready", "failed"],
      default: "pending",
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    chunks: [recordingChunkSchema],
    startedAt: Date,
    endedAt: Date,
    totalDurationSecs: Number,
    error: String,
  },
  {
    timestamps: true,
  }
);

recordingSchema.index({ showId: 1, status: 1 });
recordingSchema.index({ mosqueId: 1, createdAt: -1 });

export const Recording = mongoose.model<IRecording>(
  "Recording",
  recordingSchema
);
