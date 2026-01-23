# Minaret Backend API Documentation

> **Base URL**: `/api/v1`

## Endpoint Comparison

Your list vs. actual implementation:

| Your List                       | Method | Actual Endpoint           | Status                    |
| ------------------------------- | ------ | ------------------------- | ------------------------- |
| `/stations` (list all)          | GET    | `/stations`               | ✅ Implemented            |
| `/stations/live` (live mosques) | GET    | `/stations/live`          | ✅ Implemented            |
| `/stations/:id` (get detail)    | GET    | `/stations/:slug`         | ✅ Uses slug, not ID      |
| `/stations/my`                  | GET    | `/stations/me`            | ✅ Different name         |
| `/stations` (create)            | POST   | `/stations`               | ✅ Implemented            |
| `/stations/:id` (update)        | PATCH  | `/stations/me`            | ✅ Updates own, not by ID |
| `/stations/:id/broadcast/start` | POST   | `/stations/me/go-live`    | ✅ Different path         |
| `/stations/:id/broadcast/stop`  | POST   | `/stations/me/go-offline` | ✅ Different path         |

### Additional Endpoints Available

| Method | Endpoint                      | Purpose                              |
| ------ | ----------------------------- | ------------------------------------ |
| PATCH  | `/stations/me/now-playing`    | Update currently playing track       |
| GET    | `/stations/:slug/now-playing` | Get station's current track (public) |

---

## Authentication Endpoints

### POST `/auth/register`

Register a new mosque account.

**Request Body:**

```typescript
interface RegisterInput {
  name: string; // 2-100 chars, required
  email: string; // valid email, required
  password: string; // 6-100 chars, required
  location?: {
    city?: string;
    country?: string;
    address?: string;
  };
  contactPhone?: string;
}
```

**Response (201):**

```typescript
interface RegisterResponse {
  status: "success";
  data: {
    mosque: {
      id: string;
      name: string;
      email: string;
      slug: string;
    };
    accessToken: string;
  };
}
```

**Cookies Set:**

- `refreshToken` (HTTP-only, secure in production)

---

### POST `/auth/login`

Login with credentials.

**Request Body:**

```typescript
interface LoginInput {
  email: string;
  password: string;
}
```

**Response (200):**

```typescript
interface LoginResponse {
  status: "success";
  data: {
    mosque: {
      id: string;
      name: string;
      email: string;
      slug: string;
    };
    accessToken: string;
  };
}
```

**Cookies Set:**

- `refreshToken` (HTTP-only)

---

### POST `/auth/refresh`

Refresh access token using refresh token cookie.

**Request:** No body required (uses `refreshToken` cookie)

**Response (200):**

```typescript
interface RefreshResponse {
  status: "success";
  data: {
    accessToken: string;
  };
}
```

---

### POST `/auth/logout`

Logout and clear refresh token.

**Response (200):**

```typescript
interface LogoutResponse {
  status: "success";
  message: "Logged out successfully";
}
```

---

### GET `/auth/me` 🔒

Get current logged-in mosque profile.

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```typescript
interface GetMeResponse {
  status: "success";
  data: {
    mosque: {
      id: string;
      name: string;
      email: string;
      slug: string;
      location?: {
        city?: string;
        country?: string;
        address?: string;
      };
      contactPhone?: string;
      isActive: boolean;
      createdAt: string; // ISO date
    };
  };
}
```

---

### PATCH `/auth/profile` 🔒

Update mosque profile.

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```typescript
interface UpdateMosqueInput {
  name?: string; // 2-100 chars
  location?: {
    city?: string;
    country?: string;
    address?: string;
  };
  contactPhone?: string;
}
```

**Response (200):**

```typescript
interface UpdateProfileResponse {
  status: "success";
  data: {
    mosque: {
      id: string;
      name: string;
      email: string;
      slug: string;
      location?: {
        city?: string;
        country?: string;
        address?: string;
      };
      contactPhone?: string;
      isActive: boolean;
      createdAt: string;
    };
  };
}
```

---

### PATCH `/auth/password` 🔒

Change password.

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```typescript
interface ChangePasswordInput {
  currentPassword: string; // required
  newPassword: string; // 6-100 chars
}
```

**Response (200):**

```typescript
interface ChangePasswordResponse {
  status: "success";
  message: "Password changed successfully";
}
```

---

---

## Show Endpoints

### GET `/stations/:stationId/shows`

Get upcoming shows for a station (schedule).

**URL Params:**

- `stationId` - Station ID (e.g., `6970...`)

**Response (200):**

```typescript
interface GetStationShowsResponse {
  success: true;
  data: {
    shows: Array<Show>;
  };
}
```

---

## Station Endpoints

### GET `/stations`

List all public stations (sorted by listeners).

**Response (200):**

```typescript
interface ListStationsResponse {
  status: "success";
  results: number;
  data: {
    stations: Array<{
      _id: string;
      name: string;
      slug: string;
      description?: string;
      isLive: boolean;
      currentTrack?: {
        title?: string;
        artist?: string;
        album?: string;
        startedAt?: string;
      };
      mosqueId: {
        _id: string;
        name: string;
        slug: string;
      };
      stats: {
        totalListeners: number;
      };
    }>;
  };
}
```

---

### GET `/stations/live`

List only currently live stations (sorted by listeners).

**Response (200):**

```typescript
interface ListLiveStationsResponse {
  status: "success";
  results: number;
  data: {
    stations: Array<{
      _id: string;
      name: string;
      slug: string;
      description?: string;
      isLive: true; // Always true for this endpoint
      currentTrack?: {
        title?: string;
        artist?: string;
        album?: string;
        startedAt?: string;
      };
      mosqueId: {
        _id: string;
        name: string;
        slug: string;
      };
      stats: {
        totalListeners: number;
      };
    }>;
  };
}
```

---

### GET `/stations/:slug`

Get station by slug (public).

**URL Params:**

- `slug` - Station slug (e.g., `masjid-al-noor`)

**Response (200):**

```typescript
interface GetStationResponse {
  status: "success";
  data: {
    station: {
      _id: string;
      mosqueId: {
        _id: string;
        name: string;
        slug: string;
        location?: {
          city?: string;
          country?: string;
          address?: string;
        };
      };
      name: string;
      slug: string;
      description?: string;
      streamUrl?: string;
      mountPoint: string;
      isLive: boolean;
      currentTrack?: {
        title?: string;
        artist?: string;
        album?: string;
        startedAt?: string;
      };
      settings: {
        bitrate: number;
        format: "mp3" | "ogg" | "aac";
        isPublic: boolean;
      };
      stats: {
        totalListeners: number;
        peakListeners: number;
        totalBroadcastMinutes: number;
      };
      createdAt: string;
      updatedAt: string;
    };
  };
}
```

---

### GET `/stations/:slug/now-playing`

Get current track for a station (public).

**URL Params:**

- `slug` - Station slug

**Response (200):**

```typescript
interface GetNowPlayingResponse {
  status: "success";
  data: {
    stationName: string;
    isLive: boolean;
    currentTrack?: {
      title?: string;
      artist?: string;
      album?: string;
      startedAt?: string;
    };
  };
}
```

---

### GET `/stations/me` 🔒

Get logged-in mosque's station.

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Response (200):**

```typescript
interface GetMyStationResponse {
  status: "success";
  data: {
    station: Station; // Full station object
  };
}
```

**Error (404):**

```typescript
{
  status: "fail";
  message: "You do not have a station yet";
}
```

---

### POST `/stations` 🔒

Create a new station (first-time setup).

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```typescript
interface CreateStationInput {
  name: string; // 2-100 chars, required
  description?: string; // max 500 chars
  settings?: {
    bitrate?: "64" | "96" | "128" | "192" | "256" | "320";
    format?: "mp3" | "ogg" | "aac";
    isPublic?: boolean;
  };
}
```

**Response (201):**

```typescript
interface CreateStationResponse {
  status: "success";
  data: {
    station: Station;
  };
}
```

**Error (409):**

```typescript
{
  status: "fail";
  message: "You already have a station. Update it instead.";
}
```

---

### PATCH `/stations/me` 🔒

Update own station.

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```typescript
interface UpdateStationInput {
  name?: string; // 2-100 chars
  description?: string; // max 500 chars
  settings?: {
    bitrate?: "64" | "96" | "128" | "192" | "256" | "320";
    format?: "mp3" | "ogg" | "aac";
    isPublic?: boolean;
  };
}
```

**Response (200):**

```typescript
interface UpdateStationResponse {
  status: "success";
  data: {
    station: Station;
  };
}
```

---

### PATCH `/stations/me/now-playing` 🔒

Update currently playing track.

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```typescript
interface UpdateNowPlayingInput {
  title?: string; // max 200 chars
  artist?: string; // max 200 chars
  album?: string; // max 200 chars
}
```

**Response (200):**

```typescript
interface UpdateNowPlayingResponse {
  status: "success";
  data: {
    currentTrack: {
      title?: string;
      artist?: string;
      album?: string;
      startedAt: string; // ISO date
    };
  };
}
```

---

### POST `/stations/me/go-live` 🔒

Start broadcasting (go live).

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Request Body:** None

**Response (200):**

```typescript
interface GoLiveResponse {
  status: "success";
  message: "Station is now live";
  data: {
    isLive: true;
    streamUrl?: string;
    mountPoint: string;
  };
}
```

---

### POST `/stations/me/go-offline` 🔒

Stop broadcasting (go offline).

**Headers Required:**

```
Authorization: Bearer <accessToken>
```

**Request Body:** None

**Response (200):**

```typescript
interface GoOfflineResponse {
  status: "success";
  message: "Station is now offline";
}
```

---

## TypeScript Types for Frontend

### Core Types

```typescript
// Mosque (Account)
interface Mosque {
  id: string;
  name: string;
  email: string;
  slug: string;
  location?: {
    city?: string;
    country?: string;
    address?: string;
  };
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

// Station
interface Station {
  _id: string;
  mosqueId: string | PopulatedMosque;
  name: string;
  slug: string;
  description?: string;
  streamUrl?: string;
  mountPoint: string;
  isLive: boolean;
  currentTrack?: CurrentTrack;
  settings: StationSettings;
  stats: StationStats;
  createdAt: string;
  updatedAt: string;
}

interface PopulatedMosque {
  _id: string;
  name: string;
  slug: string;
  location?: {
    city?: string;
    country?: string;
    address?: string;
  };
}

  startedAt?: string;
}

// Show
interface Show {
  _id: string; // or id
  title: string;
  description: string;
  thumbnail?: string;
  stationId: string | { _id: string; name: string; slug: string };
  station?: Station; // If populated
  mosqueId: string | { _id: string; name: string };
  scheduledStart: string; // ISO date
  scheduledEnd: string; // ISO date
  isRecurring: boolean;
  recurringDays?: number[]; // 0-6 (Sunday-Saturday)
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface StationSettings {

interface StationSettings {
  bitrate: number;
  format: "mp3" | "ogg" | "aac";
  isPublic: boolean;
}

interface StationStats {
  totalListeners: number;
  peakListeners: number;
  totalBroadcastMinutes: number;
}

// Station list item (partial data from list endpoint)
interface StationListItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isLive: boolean;
  currentTrack?: CurrentTrack;
  mosqueId: {
    _id: string;
    name: string;
    slug: string;
  };
  stats: {
    totalListeners: number;
  };
}
```

### API Response Wrapper

```typescript
interface ApiResponse<T> {
  status: "success";
  data: T;
  message?: string;
  results?: number; // For list endpoints
}

interface ApiError {
  status: "fail" | "error";
  message: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}
```

---

## Error Response Format

All error responses follow this format:

```typescript
interface ErrorResponse {
  status: "fail" | "error"; // "fail" for client errors, "error" for server errors
  message: string;
  errors?: Array<{
    // For validation errors
    path: string;
    message: string;
  }>;
}
```

### Common HTTP Status Codes

| Code | Meaning                         |
| ---- | ------------------------------- |
| 200  | Success                         |
| 201  | Created                         |
| 400  | Bad Request (validation error)  |
| 401  | Unauthorized (no/invalid token) |
| 404  | Not Found                       |
| 409  | Conflict (duplicate resource)   |
| 500  | Internal Server Error           |

---

## Authentication Notes

### Token Flow

1. **Login/Register**: Returns `accessToken` in response body + sets `refreshToken` as HTTP-only cookie
2. **Authenticated Requests**: Send `Authorization: Bearer <accessToken>` header
3. **Token Refresh**: Call `POST /auth/refresh` (uses cookie) to get new `accessToken`
4. **Logout**: Call `POST /auth/logout` to clear refresh cookie

### Frontend Implementation Tips

```typescript
// Axios interceptor example
api.interceptors.request.use((config) => {
  const token = getAccessToken(); // From memory/state
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.data.accessToken);
      return api(error.config);
    }
    throw error;
  }
);
```
