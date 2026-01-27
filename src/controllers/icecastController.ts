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
    try {
      console.log("Icecast Auth Request:", req.body);

      const { action, user, pass, mount } = req.body;

      const station = await Station.findOne({ mountPoint: mount }).select(
        "+icecastCredentials.password"
      );

      if (!station) {
        console.log(`Denied: No station found for mount ${mount}`);
        res.setHeader("icecast-auth-user", "0");
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Mount not found");
      }

      const validUsername = station.icecastCredentials?.username === user;
      const validPassword = station.icecastCredentials?.password === pass;

      if (validUsername && validPassword) {
        console.log(`Success: Authorizing ${user} for mount ${mount}`);
        res.setHeader("icecast-auth-user", "1");
        res.writeHead(200, { "Content-Type": "text/plain" });
        return res.end("OK");
      } else {
        console.log(`Denied: Invalid credentials for ${user}`);
        res.setHeader("icecast-auth-user", "0");
        res.writeHead(401, { "Content-Type": "text/plain" });
        return res.end("Forbidden");
      }
    } catch (error) {
      console.error("Error in sourceAuth:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async listenerAuth(req: Request, res: Response): Promise<void> {
    try {
      const params: IcecastAuthParams = {
        action: req.query.action as string,
        mount: req.query.mount as string,
        ip: req.query.ip as string,
        server: req.query.server as string,
        port: req.query.port as string,
        client: req.query.client as string,
        agent: req.query.agent as string,
      };

      console.log("Listener auth request:", params);

      const isAllowed = await this.validateListener(params.ip, params.mount);

      res.setHeader("Icecast-auth-user", "1");
      res.setHeader("Icecast-auth-message", "Access granted");
      res.setHeader("Content-Type", "text/plain");
      res.status(200).send("Icecast-auth-user: 1");
    } catch (error) {
      console.error("Listener auth error:", error);
      res.setHeader("Icecast-auth-user", "0");
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Icecast-auth-message", "Server error");
      res.status(500).end();
    }
  }

  private async validateSourceCredentials(
    user?: string,
    pass?: string,
    mount?: string
  ): Promise<boolean> {
    console.log(`Validating source: user=${user}, mount=${mount}`);
    return true;
  }

  private async validateListener(
    ip?: string,
    mount?: string
  ): Promise<boolean> {
    console.log(`Validating listener: ip=${ip}, mount=${mount}`);
    return true;
  }

  async mountAdd(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        server: req.query.server as string,
        port: req.query.port as string,
      };

      console.log("Mount added:", params);
      res.status(200).end();
    } catch (error) {
      console.error("Mount add error:", error);
      res.status(500).end();
    }
  }

  async mountRemove(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        server: req.query.server as string,
      };

      console.log("Mount removed:", params);
      res.status(200).end();
    } catch (error) {
      console.error("Mount remove error:", error);
      res.status(500).end();
    }
  }

  async listenerAdd(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        client: req.query.client as string,
        ip: req.query.ip as string,
      };

      console.log("Listener added:", params);
      res.status(200).end();
    } catch (error) {
      console.error("Listener add error:", error);
      res.status(500).end();
    }
  }

  async listenerRemove(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        client: req.query.client as string,
        duration: req.query.duration as string,
      };

      console.log("Listener removed:", params);
      res.status(200).end();
    } catch (error) {
      console.error("Listener remove error:", error);
      res.status(500).end();
    }
  }
}

export const icecastAuthController = new IcecastAuthController();
