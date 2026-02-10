import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/index.js";
import {
  authRoutes,
  stationRoutes,
  showRoutes,
  searchRoutes,
  icecastRoutes,
  analyticsRoutes,
  adminRoutes,
  recordingRoutes,
} from "./routes/index.js";

const app = express();

// app.use(helmet());
const allowedOrigins = [
  "http://10.209.0.108:5173",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", authRoutes); // For /api/v1/me
app.use("/api/v1/stations", stationRoutes);
app.use("/api/v1/shows", showRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/icecast", icecastRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/recordings", recordingRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use(errorHandler);

async function startServer() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Minaret API running on port ${env.port}`);
    console.log(`Health check: http://localhost:${env.port}/api/v1/health`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(console.error);
}

export default app;
