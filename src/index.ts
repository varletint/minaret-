import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/index.js";
import { authRoutes, stationRoutes, showRoutes } from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use(errorHandler);

// Start server with database connection
async function startServer() {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`Minaret API running on port ${env.port}`);
    console.log(`Health check: http://localhost:${env.port}/api/v1/health`);
  });
}

startServer().catch(console.error);

export default app;
