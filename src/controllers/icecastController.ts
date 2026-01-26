import { Request, Response } from "express";

/**
 * Icecast Authentication Controller
 *
 * Handles dynamic authentication for Icecast sources and listeners
 * via URL-based authentication roles.
 */

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
  /**
   * Source Authentication
   * Called when a broadcaster (BUTT, CoolMic, etc) tries to connect
   *
   * Icecast sends parameters as query strings:
   * - action: "stream_auth" or "mount_add"
   * - mount: mountpoint name (e.g., "/live")
   * - user: username provided by source
   * - pass: password provided by source
   * - ip: source IP address
   * - server: Icecast server
   * - port: Icecast port
   * - client: client ID
   */
  // async sourceAuth(req: Request, res: Response): Promise<void> {
  //   console.log("=== SOURCE AUTH CALLED ===");
  //   console.log("Body:", req.body);
  //   console.log("Query:", req.query);
  //   console.log("Headers:", req.headers);

  //   try {
  //     // Icecast sends data in POST body, not query string
  //     const params: IcecastAuthParams = {
  //       action: req.body.action as string,
  //       mount: req.body.mount as string,
  //       user: req.body.user as string,
  //       pass: req.body.pass as string,
  //       ip: req.body.ip as string,
  //       server: req.body.server as string,
  //       port: req.body.port as string,
  //       client: req.body.client as string,
  //     };

  //     console.log("Source auth request:", params);

  //     // YOUR AUTHENTICATION LOGIC HERE
  //     // Example: Check credentials against database, API, etc.
  //     const isValid = await this.validateSourceCredentials(
  //       params.user,
  //       params.pass,
  //       params.mount
  //     );

  //     if (isValid) {
  //       // CRITICAL: Return 200 status with icecast-auth-user: 1
  //       res.setHeader("icecast-auth-user", "1");
  //       res.setHeader("icecast-auth-message", "Authentication successful");

  //       // Optional: You can set custom headers for metadata
  //       // res.setHeader('icecast-auth-timelimit', '3600'); // Limit connection time

  //       res.status(200).end();
  //     } else {
  //       // Return 403 for authentication failure
  //       res.setHeader("icecast-auth-user", "0");
  //       res.setHeader("icecast-auth-message", "Invalid credentials");
  //       res.status(403).end();
  //     }
  //   } catch (error) {
  //     console.error("Source auth error:", error);
  //     res.setHeader("icecast-auth-user", "0");
  //     res.setHeader("icecast-auth-message", "Server error");
  //     res.status(500).end();
  //   }
  // }

  async sourceAuth(req: Request, res: Response) {
    const { user, pass, mount, ip } = req.body;

    console.log(
      `Connection attempt from ${user} on mount ${mount} (IP: ${ip})`
    );

    // --- YOUR DYNAMIC LOGIC HERE ---
    // Example: Check against a database or external API
    const isUserValid = user === "sourcer" && pass === "hackme";

    if (isUserValid) {
      console.log("Access Granted");

      // Success: Tell Icecast to allow the stream.
      // You can also define the Role/ACL here to fill those (null) fields!
      res.set({
        "Icecast-Auth": "1",
        "Icecast-Role": "DJ_Premium",
        "Icecast-ACL": "admin-access",
      });
      res.set("Content-Type", "text/plain");
      return res.status(200).send("icecast-auth-user: 1");
    } else {
      console.log("Access Denied");

      // Failure: Tell Icecast to block the connection.
      res.set({
        "Icecast-Auth": "0",
        "Icecast-Auth-Message": "Invalid dynamic credentials",
      });
      return res.status(401).send("icecast-auth-user: 0");
    }
  }
  /**
   * Listener Authentication
   * Called when a listener tries to connect to a stream
   */
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

      // YOUR LISTENER VALIDATION LOGIC HERE
      // Example: Check IP blacklist, concurrent connections, etc.
      const isAllowed = await this.validateListener(params.ip, params.mount);

      // if (isAllowed) {

      res.setHeader("icecast-auth-user", "1");
      res.setHeader("icecast-auth-message", "Access granted");
      res.setHeader("Content-Type", "text/plain");
      res.status(200).send("icecast-auth-user: 1");
      // } else {
      // res.setHeader("icecast-auth-user", "0");
      // res.setHeader("icecast-auth-message", "Access denied");
      // res.status(403).send("Access denied");
      // }
    } catch (error) {
      console.error("Listener auth error:", error);
      res.setHeader("icecast-auth-user", "0");
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("icecast-auth-message", "Server error");
      res.status(500).end();
    }
  }

  /**
   * Validate source credentials
   * Replace this with your actual authentication logic
   */
  private async validateSourceCredentials(
    user?: string,
    pass?: string,
    mount?: string
  ): Promise<boolean> {
    // EXAMPLE IMPLEMENTATION - Replace with your logic

    // Option 1: Simple hardcoded check
    // return user === 'broadcaster' && pass === 'secret123';

    // Option 2: Database check
    // const broadcaster = await db.broadcasters.findOne({ username: user });
    // return broadcaster && await bcrypt.compare(pass, broadcaster.passwordHash);

    // Option 3: Dynamic/token-based
    // const tokenValid = await this.validateToken(pass);
    // return tokenValid;

    // For now, accept any credentials (like your no-auth setup)
    console.log(`Validating source: user=${user}, mount=${mount}`);
    return true; // Change this to your actual validation
  }

  /**
   * Validate listener access
   * Replace this with your actual validation logic
   */
  private async validateListener(
    ip?: string,
    mount?: string
  ): Promise<boolean> {
    // EXAMPLE IMPLEMENTATION - Replace with your logic

    // Option 1: Check IP blacklist
    // const isBlacklisted = await db.blacklist.exists({ ip });
    // if (isBlacklisted) return false;

    // Option 2: Check concurrent connections
    // const connections = await this.getActiveConnections(ip);
    // if (connections > 5) return false;

    // For now, allow all listeners
    console.log(`Validating listener: ip=${ip}, mount=${mount}`);
    return true; // Change this to your actual validation
  }

  /**
   * Mount Add Event
   * Called when a source connects successfully
   */
  async mountAdd(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        server: req.query.server as string,
        port: req.query.port as string,
      };

      console.log("Mount added:", params);

      // YOUR LOGIC HERE
      // Example: Update database, send notifications, etc.
      // await db.mounts.create({ name: params.mount, status: 'live' });

      res.status(200).end();
    } catch (error) {
      console.error("Mount add error:", error);
      res.status(500).end();
    }
  }

  /**
   * Mount Remove Event
   * Called when a source disconnects
   */
  async mountRemove(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        server: req.query.server as string,
      };

      console.log("Mount removed:", params);

      // YOUR LOGIC HERE
      // await db.mounts.update({ name: params.mount }, { status: 'offline' });

      res.status(200).end();
    } catch (error) {
      console.error("Mount remove error:", error);
      res.status(500).end();
    }
  }

  /**
   * Listener Add Event
   * Called when a listener connects
   */
  async listenerAdd(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        client: req.query.client as string,
        ip: req.query.ip as string,
      };

      console.log("Listener added:", params);

      // YOUR LOGIC HERE
      // await db.listeners.increment({ mount: params.mount });

      res.status(200).end();
    } catch (error) {
      console.error("Listener add error:", error);
      res.status(500).end();
    }
  }

  /**
   * Listener Remove Event
   * Called when a listener disconnects
   */
  async listenerRemove(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        mount: req.query.mount as string,
        client: req.query.client as string,
        duration: req.query.duration as string,
      };

      console.log("Listener removed:", params);

      // YOUR LOGIC HERE
      // await db.listeners.decrement({ mount: params.mount });

      res.status(200).end();
    } catch (error) {
      console.error("Listener remove error:", error);
      res.status(500).end();
    }
  }
}

// Export singleton instance
export const icecastAuthController = new IcecastAuthController();
