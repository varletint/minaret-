# Minaret Backend 🕌

Mosque internet radio broadcasting API built with **Express**, **TypeScript**, and **MongoDB**.

## Features

- 🔐 **Authentication** — JWT with refresh tokens
- 📡 **Station Management** — Create and manage radio stations
- 📅 **Show Scheduling** — Schedule programs with recurrence
- 🎙️ **Live Broadcast** — Go live/offline, now playing metadata
- 🔧 **Icecast Integration** — Stream audio via Icecast

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Atlas)
- **Streaming**: Icecast
- **Process Manager**: PM2

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your MongoDB URI and secrets

# Development
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Authentication

| Method | Endpoint                | Description     |
| ------ | ----------------------- | --------------- |
| POST   | `/api/v1/auth/register` | Register mosque |
| POST   | `/api/v1/auth/login`    | Login           |
| POST   | `/api/v1/auth/refresh`  | Refresh token   |
| POST   | `/api/v1/auth/logout`   | Logout          |
| GET    | `/api/v1/me`            | Get profile     |

### Stations

| Method | Endpoint                         | Description          |
| ------ | -------------------------------- | -------------------- |
| POST   | `/api/v1/stations`               | Create station       |
| GET    | `/api/v1/stations`               | List public stations |
| GET    | `/api/v1/stations/me`            | My station           |
| PATCH  | `/api/v1/stations/me`            | Update station       |
| POST   | `/api/v1/stations/me/go-live`    | Go live              |
| POST   | `/api/v1/stations/me/go-offline` | Go offline           |

### Shows

| Method | Endpoint                  | Description |
| ------ | ------------------------- | ----------- |
| POST   | `/api/v1/shows`           | Create show |
| GET    | `/api/v1/shows`           | List shows  |
| GET    | `/api/v1/shows/my`        | My shows    |
| POST   | `/api/v1/shows/:id/start` | Start show  |
| POST   | `/api/v1/shows/:id/end`   | End show    |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Hetzner deployment guide.

## Project Structure

```
src/
├── config/        # Environment, database config
├── middleware/    # Auth, validation, error handling
├── models/        # Mongoose schemas
├── routes/        # API routes
├── schemas/       # Zod validation schemas
├── utils/         # JWT utilities
└── index.ts       # Express app entry
```

## License

ISC © varletint
