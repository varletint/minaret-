# Minaret Backend

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6.svg)
![Node.js](https://img.shields.io/badge/runtime-Node.js%20v20%2B-339933.svg)
![Express](https://img.shields.io/badge/framework-Express-000000.svg)

**Minaret** is a robust, production-ready backend API for Mosque internet radio broadcasting. It serves as the bridge between broadcasters (Mosques), the Icecast streaming server, and listeners, managing authentication, station metadata, show scheduling, and real-time broadcasting control.

---

## 🏗️ Architecture

The system coordinates between the Broadcaster App, the Backend API, and the Icecast Streaming Server.

```mermaid
graph TD
    Client[Broadcaster App / Listener]
    API[Minaret Backend API]
    DB[(MongoDB Atlas)]
    Icecast[Icecast Server]

    Client -- "Auth / Manage Stations" --> API
    API -- "Store Data" --> DB
    Client -- "Stream Audio (Source)" --> Icecast
    API -- "Control Stream / Webhooks" --> Icecast
    Icecast -- "Audio Stream" --> Client
```

## ✨ Key Features

- **🔐 Secure Authentication**: JWT-based auth with access and refresh token rotation.
- **📡 Station Management**: Create, update, and manage radio station metadata publicly.
- **📅 Smart Scheduling**: Schedule recurring shows and programs with flexible timing.
- **🎙️ Live Broadcast Control**: Seamlessly transition between live and offline states with real-time metadata updates.
- **🔧 Icecast Integration**: Tightly integrated with Icecast for authentication and stream management.
- **☁️ Production Ready**: Configured for deployment on VPS providers like Kamarate or Hetzner.

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript 5.x
- **Database**: MongoDB (Atlas)
- **Streaming**: Icecast 2.4+
- **Process Manager**: PM2

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **MongoDB**: A running instance (local or Atlas)
- **Icecast**: An Icecast server running locally or remotely

### Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd minaret-backend
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment**
    Copy the example configuration and update it with your secrets.

    ```bash
    cp .env.example .env
    ```

    > **Important**: Ensure your `.env` connects to your running MongoDB instance and matches your Icecast admin credentials.

4.  **Run Locally**
    ```bash
    npm run dev
    ```

## 📡 Broadcasting & Streaming

### Connecting a Broadcasting Client

To broadcast audio to your station, you need a source client. You can use standard tools or build a custom app.

**Recommended Settings:**

- **Protocol**: Icecast / SHOUTcast
- **Hostname**: Your server IP (e.g., `127.0.0.1` or VPS IP)
- **Port**: `8000` (default Icecast port)
- **Mountpoint**: `/live` (or your specific station mount)
- **Username**: `source`
- **Password**: Your configured source password

### Icecast Info

This backend authenticates Icecast sources via webhooks (if configured) or standard mountpoint passwords. Ensure your Icecast XML configuration aligns with the backend's expected behavior.

## ☁️ Infrastructure & Deployment

For a reliable production broadcasting environment, we recommend using a **Virtual Private Server (VPS)**.

### Recommended Provider: [Kamarate](https://kamarate.com)

**Kamarate** offers high-performance VPS hosting suitable for audio streaming.

1.  Rent a VPS (Ubuntu 22.04/24.04 LTS recommended).
2.  Install Node.js, PM2, and your Icecast server.
3.  Deploy this backend using the guide below.

For a detailed deployment guide on Hetzner/Ubuntu, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                | Description                   |
| :----- | :---------------------- | :---------------------------- |
| `POST` | `/api/v1/auth/register` | Register a new mosque account |
| `POST` | `/api/v1/auth/login`    | Login and receive tokens      |
| `POST` | `/api/v1/auth/refresh`  | Refresh access token          |

### Stations

| Method  | Endpoint                      | Description              |
| :------ | :---------------------------- | :----------------------- |
| `POST`  | `/api/v1/stations`            | Create a new station     |
| `GET`   | `/api/v1/stations`            | List all public stations |
| `GET`   | `/api/v1/stations/me`         | Get my station details   |
| `PATCH` | `/api/v1/stations/me`         | Update station profile   |
| `POST`  | `/api/v1/stations/me/go-live` | Set status to Live       |

### Shows

| Method | Endpoint        | Description          |
| :----- | :-------------- | :------------------- |
| `GET`  | `/api/v1/shows` | List scheduled shows |
| `POST` | `/api/v1/shows` | Create a new show    |

## 📂 Project Structure

```
src/
├── config/         # Environment variables & DB config
├── controllers/    # Request logic & handlers
├── middleware/     # Auth checks, validation, error handling
├── models/         # Mongoose Data Models
├── routes/         # Express Route definitions
├── schemas/        # Zod Validation schemas
├── services/       # Business logic (optional layer)
└── utils/          # Helper functions & constants
```

## 📄 License

ISC © varletint
