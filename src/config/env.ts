import dotenv from "dotenv";
dotenv.config();

export const env = {
  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB
  mongoUri:
    process.env.MONGODB_URI ||
    "mongodb+srv://intvarlet:intvarlet@mern-blog.pe8eeaf.mongodb.net/mern-blog?retryWrites=true&w=majority&appName=mern-blog",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "default-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",

  // Icecast
  icecast: {
    host: process.env.ICECAST_HOST || "localhost",
    port: parseInt(process.env.ICECAST_PORT || "8000", 10),
    adminUser: process.env.ICECAST_ADMIN_USER || "admin",
    adminPassword: process.env.ICECAST_ADMIN_PASSWORD || "hackme",
  },
} as const;
