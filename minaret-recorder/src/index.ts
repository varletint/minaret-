import express, { Request, Response, NextFunction } from "express";
import { config } from "./config.js";
import { startRecording, stopRecording, getSessionStatus } from "./recorder.js";

const app = express();
app.use(express.json());

// API Key middleware
function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== config.mainApiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "minaret-recorder" });
});

// Start recording
app.post("/start", apiKeyAuth, async (req: Request, res: Response) => {
  const { recordingId, streamUrl, codec, mosqueId, showTitle, callbackUrl } =
    req.body;

  if (!recordingId || !streamUrl || !callbackUrl) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    await startRecording(
      recordingId,
      streamUrl,
      codec || "mp3",
      mosqueId,
      showTitle,
      callbackUrl
    );

    res.json({ status: "ok", message: "Recording started", recordingId });
  } catch (error) {
    console.error("Failed to start recording:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to start recording",
    });
  }
});

// Stop recording
app.post("/stop/:recordingId", apiKeyAuth, (req: Request, res: Response) => {
  const recordingId = req.params.recordingId as string;

  const stopped = stopRecording(recordingId);
  if (stopped) {
    res.json({ status: "ok", message: "Recording stop initiated" });
  } else {
    res.status(404).json({ error: "Recording not found or already stopped" });
  }
});

// Get recording status
app.get("/status/:recordingId", apiKeyAuth, (req: Request, res: Response) => {
  const recordingId = req.params.recordingId as string;

  const status = getSessionStatus(recordingId);
  if (status) {
    res.json(status);
  } else {
    res.status(404).json({ error: "Recording not found" });
  }
});

app.listen(config.port, () => {
  console.log(`Minaret Recorder running on port ${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
});
