import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "./config.js";
import { uploadToStorage } from "./storage.js";

interface RecordingSession {
  recordingId: string;
  streamUrl: string;
  codec: "mp3" | "aac";
  mosqueId: string;
  showTitle: string;
  callbackUrl: string;
  ffmpegProcess: ChildProcess | null;
  sessionDir: string;
  chunkIndex: number;
  startedAt: Date;
}

const activeSessions = new Map<string, RecordingSession>();

function getRecordingsDir(): string {
  const dir = path.join(process.cwd(), "recordings");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function sendCallback(callbackUrl: string, data: object): Promise<void> {
  try {
    await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": config.mainApiKey,
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error("Callback failed:", error);
  }
}

function detectCodec(tsPath: string): Promise<"mp3" | "aac"> {
  return new Promise((resolve) => {
    const ffprobe = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "a:0",
      "-show_entries",
      "stream=codec_name",
      "-of",
      "default=nokey=1:noprint_wrappers=1",
      tsPath,
    ]);

    let output = "";
    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", () => {
      const codec = output.trim().toLowerCase();
      if (codec.includes("aac")) resolve("aac");
      else resolve("mp3");
    });
  });
}

async function processChunk(
  session: RecordingSession,
  tsPath: string,
  chunkIndex: number
): Promise<void> {
  console.log(
    `[${session.recordingId}] Processing chunk ${chunkIndex}: ${tsPath}`
  );
  const codec = await detectCodec(tsPath);
  console.log(`[${session.recordingId}] Detected codec: ${codec}`);
  const ext = codec === "aac" ? "m4a" : "mp3";
  const contentType = codec === "aac" ? "audio/mp4" : "audio/mpeg";

  const outFilename = `chunk_${String(chunkIndex).padStart(4, "0")}.${ext}`;
  const outPath = path.join(session.sessionDir, outFilename);

  // Remux .ts to .mp3/.m4a (no re-encode, fast)
  await new Promise<void>((resolve, reject) => {
    const args =
      codec === "aac"
        ? ["-y", "-i", tsPath, "-vn", "-c:a", "copy", "-f", "ipod", outPath]
        : ["-y", "-i", tsPath, "-vn", "-c:a", "copy", outPath];

    const ffmpeg = spawn("ffmpeg", args);
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Remux failed with code ${code}`));
    });
  });

  // Upload to R2
  const storagePath = `recordings/public/${session.mosqueId}/${session.recordingId}/${outFilename}`;
  console.log(`[${session.recordingId}] Uploading to R2: ${storagePath}`);
  const publicUrl = await uploadToStorage(outPath, storagePath, contentType);
  console.log(`[${session.recordingId}] Upload complete: ${publicUrl}`);

  // Get file size
  const stats = fs.statSync(outPath);

  // Send callback to main API
  await sendCallback(session.callbackUrl, {
    recordingId: session.recordingId,
    status: "recording",
    chunk: {
      index: chunkIndex,
      filename: outFilename,
      storagePath,
      publicUrl,
      codec,
      sizeBytes: stats.size,
    },
  });

  // Cleanup local files
  try {
    fs.unlinkSync(tsPath);
    fs.unlinkSync(outPath);
  } catch {}
}

export async function startRecording(
  recordingId: string,
  streamUrl: string,
  codec: "mp3" | "aac",
  mosqueId: string,
  showTitle: string,
  callbackUrl: string
): Promise<void> {
  const sessionDir = path.join(getRecordingsDir(), recordingId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const session: RecordingSession = {
    recordingId,
    streamUrl,
    codec,
    mosqueId,
    showTitle,
    callbackUrl,
    ffmpegProcess: null,
    sessionDir,
    chunkIndex: 0,
    startedAt: new Date(),
  };

  activeSessions.set(recordingId, session);

  console.log(`[${recordingId}] Starting recording...`);
  console.log(`[${recordingId}] Stream URL: ${streamUrl}`);
  console.log(`[${recordingId}] Session dir: ${sessionDir}`);

  const tsPattern = path.join(sessionDir, "chunk_%04d.ts");

  const ffmpegArgs = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-reconnect",
    "1",
    "-reconnect_streamed",
    "1",
    "-reconnect_delay_max",
    "10",
    "-i",
    streamUrl,
    "-map",
    "0:a:0",
    "-c:a",
    "copy",
    "-f",
    "segment",
    "-segment_time",
    String(config.chunkDurationSecs),
    "-reset_timestamps",
    "1",
    tsPattern,
  ];

  const ffmpeg = spawn("ffmpeg", ffmpegArgs, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  session.ffmpegProcess = ffmpeg;
  console.log(`[${recordingId}] FFmpeg spawned with PID: ${ffmpeg.pid}`);

  ffmpeg.stderr.on("data", (data) => {
    const msg = data.toString().trim();
    console.log(`[${recordingId}] FFmpeg: ${msg}`);
    // Detect when a new segment is opened
    if (msg.includes("Opening") && msg.includes(".ts")) {
      // Process previous chunk if exists
      const prevChunkPath = path.join(
        sessionDir,
        `chunk_${String(session.chunkIndex).padStart(4, "0")}.ts`
      );
      if (fs.existsSync(prevChunkPath)) {
        processChunk(session, prevChunkPath, session.chunkIndex).catch(
          console.error
        );
        session.chunkIndex++;
      }
    }
  });

  ffmpeg.on("close", async (code) => {
    console.log(`[${recordingId}] FFmpeg exited with code ${code}`);

    // Process any remaining chunks
    const files = fs.readdirSync(sessionDir).filter((f) => f.endsWith(".ts"));
    console.log(
      `[${recordingId}] Remaining .ts files to process: ${files.length}`,
      files
    );
    for (const file of files) {
      const idx = parseInt(file.match(/chunk_(\d+)\.ts/)?.[1] || "0", 10);
      await processChunk(session, path.join(sessionDir, file), idx);
    }

    // Calculate total duration
    const endedAt = new Date();
    const totalDurationSecs = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000
    );

    // Send final callback
    await sendCallback(callbackUrl, {
      recordingId,
      status: "ready",
      endedAt: endedAt.toISOString(),
      totalDurationSecs,
    });

    // Cleanup session directory
    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {}

    activeSessions.delete(recordingId);
  });

  ffmpeg.on("error", async (error) => {
    console.error(`[${recordingId}] FFmpeg spawn error:`, error.message);
    await sendCallback(callbackUrl, {
      recordingId,
      status: "failed",
      error: error.message,
    });
    activeSessions.delete(recordingId);
  });
}

export function stopRecording(recordingId: string): boolean {
  const session = activeSessions.get(recordingId);
  if (!session || !session.ffmpegProcess) {
    return false;
  }

  // Send SIGTERM to gracefully stop FFmpeg
  session.ffmpegProcess.kill("SIGTERM");
  return true;
}

export function getSessionStatus(recordingId: string): object | null {
  const session = activeSessions.get(recordingId);
  if (!session) return null;

  return {
    recordingId,
    streamUrl: session.streamUrl,
    chunkIndex: session.chunkIndex,
    startedAt: session.startedAt,
    isRunning: session.ffmpegProcess !== null,
  };
}
