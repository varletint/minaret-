import { Request, Response } from "express";
import { Station } from "../models/Station";

interface IcecastAuthParams {
  action?: string;
  mount?: string;
  user?: string;
  pass?: string;
  ip?: string;
  server?: string;
  port?: string;
  client?: string;
  agent?: string;
}

export class IcecastAuthController {
  async sourceAuth(req: Request, res: Response) {
    console.log("Source auth request:", req.body);
    const { action, user, pass, mount } = req.body;

    const station = await Station.findOne({ mountPoint: mount }).select(
      "+icecastCredentials.password"
    );

    if (!station) {
      res.setHeader("icecast-auth-user", "0");
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Mount not found");
    }

    const validUsername = station.icecastCredentials?.username === user;
    const validPassword = station.icecastCredentials?.password === pass;

    if (validUsername && validPassword) {
      res.setHeader("icecast-auth-user", "1");
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("OK");
    } else {
      res.setHeader("icecast-auth-user", "0");
      res.writeHead(401, { "Content-Type": "text/plain" });
      return res.end("Forbidden");
    }
  }

  async listenerAuth(req: Request, res: Response): Promise<void> {
    const params: IcecastAuthParams = {
      action: req.query.action as string,
      mount: req.query.mount as string,
      ip: req.query.ip as string,
      server: req.query.server as string,
      port: req.query.port as string,
      client: req.query.client as string,
      agent: req.query.agent as string,
    };

    const isAllowed = await this.validateListener(params.ip, params.mount);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  }

  private async validateSourceCredentials(
    user?: string,
    pass?: string,
    mount?: string
  ): Promise<boolean> {
    return true;
  }

  private async validateListener(
    ip?: string,
    mount?: string
  ): Promise<boolean> {
    return true;
  }

  async mountAdd(req: Request, res: Response): Promise<void> {
    const params = {
      mount: req.body.mount as string,
      server: req.body.server as string,
      port: req.body.port as string,
    };

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  }

  async mountRemove(req: Request, res: Response): Promise<void> {
    const params = {
      mount: req.body.mount as string,
      server: req.body.server as string,
    };

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  }

  async listenerAdd(req: Request, res: Response) {
    console.log(req.body);
    const { mount, client, ip } = req.body;

    const station = await Station.findOne({ mountPoint: mount });
    if (station) {
      station.stats.currentListeners += 1;
      station.stats.totalListeners += 1;
      if (station.stats.currentListeners > station.stats.peakListeners) {
        station.stats.peakListeners = station.stats.currentListeners;
      }
      await station.save();
    }
    res.set("icecast-auth-user", "1");
    return res.status(200).send("OK");
  }

  // async listenerAdd(req: Request, res: Response): Promise<void> {
  //   const { mount, client, ip } = req.body;

  //   console.log(
  //     `[Icecast] Listener connected - Mount: ${mount}, Client: ${client}, IP: ${ip}`
  //   );

  //   console.log(req.body);

  //   try {
  //     const station = await Station.findOne({ mountPoint: mount });

  //     if (station) {
  //       // Increment current and total listeners
  //       station.stats.currentListeners += 1;
  //       station.stats.totalListeners += 1;

  //       // Update peak listeners if current exceeds peak
  //       if (station.stats.currentListeners > station.stats.peakListeners) {
  //         station.stats.peakListeners = station.stats.currentListeners;
  //       }

  //       await station.save();

  //       console.log(
  //         `[Icecast] Station ${mount} - Current: ${station.stats.currentListeners}, Peak: ${station.stats.peakListeners}, Total: ${station.stats.totalListeners}`
  //       );
  //     } else {
  //       console.log(`[Icecast] Station not found for mount: ${mount}`);
  //     }
  //   } catch (error) {
  //     console.error(`[Icecast] Error updating listener stats:`, error);
  //   }

  //   res.writeHead(200, { "Content-Type": "text/plain" });
  //   res.end("OK");
  // }

  async listenerRemove(req: Request, res: Response): Promise<void> {
    const { mount, client, duration } = req.body;

    console.log(
      `[Icecast] Listener disconnected - Mount: ${mount}, Client: ${client}, Duration: ${duration}s`
    );

    try {
      const station = await Station.findOne({ mountPoint: mount });

      if (station) {
        // Decrement current listeners (ensure it doesn't go below 0)
        station.stats.currentListeners = Math.max(
          0,
          station.stats.currentListeners - 1
        );

        // Add listening duration to total broadcast minutes
        if (duration) {
          const durationMinutes = Math.floor(parseInt(duration, 10) / 60);
          station.stats.totalBroadcastMinutes += durationMinutes;
        }

        await station.save();

        console.log(
          `[Icecast] Station ${mount} - Current: ${station.stats.currentListeners}, Total Minutes: ${station.stats.totalBroadcastMinutes}`
        );
      } else {
        console.log(`[Icecast] Station not found for mount: ${mount}`);
      }
    } catch (error) {
      console.error(`[Icecast] Error updating listener stats:`, error);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  }
}

export const icecastAuthController = new IcecastAuthController();
