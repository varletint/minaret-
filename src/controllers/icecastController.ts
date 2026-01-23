import { Request, Response } from "express";
import { Station } from "../models/Station.js";

/**
 * Icecast Webhook Controller
 *
 * These endpoints are called by Icecast server when:
 * - A source (broadcaster) connects/disconnects from a mount point
 * - A listener connects/disconnects from a stream
 *
 * Icecast sends data as application/x-www-form-urlencoded
 */

// POST /api/v1/icecast/mount-add
// Called when a broadcaster connects to a mount point
export async function onMountAdd(req: Request, res: Response): Promise<void> {
  const { mount, server } = req.body;

  if (!mount) {
    res.status(400).send("Mount point required");
    return;
  }

  // Normalize mount point (ensure leading slash)
  const mountPoint = mount.startsWith("/") ? mount : `/${mount}`;

  const station = await Station.findOne({ mountPoint });
  if (!station) {
    res.status(200).send("OK");
    return;
  }

  station.isLive = true;
  await station.save();

  res.status(200).send("OK");
}

// POST /api/v1/icecast/mount-remove
// Called when a broadcaster disconnects from a mount point
export async function onMountRemove(
  req: Request,
  res: Response
): Promise<void> {
  const { mount } = req.body;

  console.log(`[Icecast] Mount remove: ${mount}`);

  if (!mount) {
    res.status(400).send("Mount point required");
    return;
  }

  const mountPoint = mount.startsWith("/") ? mount : `/${mount}`;

  const station = await Station.findOne({ mountPoint });
  if (!station) {
    res.status(200).send("OK");
    return;
  }

  // Update station status
  station.isLive = false;
  station.currentTrack = undefined;
  await station.save();

  console.log(`[Icecast] Station "${station.name}" is now OFFLINE`);

  res.status(200).send("OK");
}

// POST /api/v1/icecast/listener-add
// Called when a listener connects to the stream
// this is optional (for analytics)
export async function onListenerAdd(
  req: Request,
  res: Response
): Promise<void> {
  const { mount, ip, client } = req.body;

  if (!mount) {
    res.status(200).send("OK");
    return;
  }

  const mountPoint = mount.startsWith("/") ? mount : `/${mount}`;

  // Increment listener count
  await Station.findOneAndUpdate(
    { mountPoint },
    {
      $inc: { "stats.totalListeners": 1 },
    }
  );

  res.status(200).send("OK");
}

// POST /api/v1/icecast/listener-remove
// Called when a listener disconnects from the stream
export async function onListenerRemove(
  req: Request,
  res: Response
): Promise<void> {
  const { mount, ip, client } = req.body;

  res.status(200).send("OK");
}

// POST /api/v1/icecast/source-auth
// Called to authenticate a source before allowing connection
export async function sourceAuth(req: Request, res: Response): Promise<void> {
  const { mount, user, pass } = req.body;

  if (!mount || !user || !pass) {
    res.status(401).send("Unauthorized");
    return;
  }

  const mountPoint = mount.startsWith("/") ? mount : `/${mount}`;

  // Find station with credentials (select password explicitly)
  const station = await Station.findOne({ mountPoint }).select(
    "+icecastCredentials.password"
  );

  if (!station || !station.icecastCredentials) {
    console.log(`[Icecast] No station or credentials for mount: ${mountPoint}`);
    res.status(401).send("Unauthorized");
    return;
  }

  // Verify credentials
  if (
    station.icecastCredentials.username === user &&
    station.icecastCredentials.password === pass
  ) {
    res.status(200).send("OK");
  } else {
    res.status(401).send("Unauthorized");
  }
}
