# Analytics API - Frontend Integration Guide

## Overview

Track user interactions like page views and audio playback events.

---

## Setup

### 1. Create Analytics Service

```typescript
// src/services/analytics.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

type EventType = "PAGE_VIEW" | "PLAY_START" | "PLAY_STOP";

interface TrackEventPayload {
  stationId?: string;
  path?: string;
  [key: string]: any;
}

export const trackEvent = (
  type: EventType,
  payload: TrackEventPayload = {}
) => {
  // Fire and forget - don't await, don't block UI
  axios
    .post(`${API_URL}/api/analytics/events`, { type, payload })
    .catch(() => {}); // Silently fail
};
```

---

## Usage

### Track Page Views

```typescript
// src/hooks/usePageTracking.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/services/analytics";

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    trackEvent("PAGE_VIEW", { path: location.pathname });
  }, [location.pathname]);
};

// Usage: Call usePageTracking() in your App or Layout component
```

### Track Play Events

```typescript
// In your player component
import { trackEvent } from "@/services/analytics";

const handlePlay = (stationId: string) => {
  trackEvent("PLAY_START", { stationId });
  // ... play audio
};

const handleStop = (stationId: string) => {
  trackEvent("PLAY_STOP", { stationId });
  // ... stop audio
};
```

---

## API Reference

**Endpoint:** `POST /api/analytics/events`

**Request Body:**

```json
{
  "type": "PAGE_VIEW" | "PLAY_START" | "PLAY_STOP",
  "payload": {
    "stationId": "optional - for play events",
    "path": "optional - for page views"
  }
}
```

**Response:** `201 Created`

---

## Event Types

| Event        | When to Fire      | Payload                 |
| ------------ | ----------------- | ----------------------- |
| `PAGE_VIEW`  | On route change   | `{ path: string }`      |
| `PLAY_START` | User clicks play  | `{ stationId: string }` |
| `PLAY_STOP`  | User stops/pauses | `{ stationId: string }` |
