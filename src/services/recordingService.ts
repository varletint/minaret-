import { env } from "../config/env.js";
import { Recording } from "../models/Recording.js";
import { IStation } from "../models/Station.js";
import { IShow } from "../models/Show.js";

interface StartRecordingParams {
  show: IShow;
  station: IStation;
}

export async function triggerRecordingStart({
  show,
  station,
}: StartRecordingParams): Promise<string> {
  const recording = await Recording.create({
    showId: show._id,
    stationId: station._id,
    mosqueId: show.mosqueId,
    status: "pending",
    visibility: "public",
    startedAt: new Date(),
  });

  // When sending to the VPS recorder, we want to use the internal/direct URL
  // (localhost) because the recorder is running on the same machine as Icecast.
  // Using the public HTTPS URL causes SSL/TLS handshake failures in FFmpeg.
  const streamUrl = `http://localhost:${env.icecast.port}${station.mountPoint}`;

  try {
    const response = await fetch(`${env.recording.serviceUrl}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.recording.apiKey,
      },
      body: JSON.stringify({
        recordingId: recording._id.toString(),
        streamUrl,
        codec: station.settings.format,
        mosqueId: show.mosqueId.toString(),
        showTitle: show.title,
        callbackUrl: `${
          process.env.API_BASE_URL || "http://localhost:3000"
        }/api/v1/recordings/callback`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Recording service responded with ${response.status}`);
    }

    recording.status = "recording";
    await recording.save();

    return recording._id.toString();
  } catch (error) {
    recording.status = "failed";
    recording.error =
      error instanceof Error ? error.message : "Failed to start recording";
    await recording.save();
    throw error;
  }
}

export async function triggerRecordingStop(recordingId: string): Promise<void> {
  try {
    const response = await fetch(
      `${env.recording.serviceUrl}/stop/${recordingId}`,
      {
        method: "POST",
        headers: {
          "X-API-Key": env.recording.apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to stop recording: ${response.status}`);
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
  }
}
