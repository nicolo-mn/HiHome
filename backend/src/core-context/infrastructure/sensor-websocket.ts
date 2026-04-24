import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { HomeService } from "../application/home-service";

const DEFAULT_INTERVAL_MS = 5000;

export function setupSensorWebSocket(
  server: HttpServer,
  homeService: HomeService,
): void {
  const wss = new WebSocketServer({ server, path: "/ws/sensors" });

  wss.on("connection", (ws: WebSocket, req) => {
    // Extract token from query parameters
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      ws.close(4001, "Authentication required");
      return;
    }

    try {
      jwt.verify(token, secret);
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }

    // Configurable interval from env, client can override
    let intervalMs =
      parseInt(process.env.SENSOR_INTERVAL_MS || "", 10) || DEFAULT_INTERVAL_MS;

    const sendReadings = () => {
      if (ws.readyState === WebSocket.OPEN) {
        const readings = homeService.generateSensorReadings();
        ws.send(JSON.stringify({ type: "sensor_update", readings }));
      }
    };

    // Send initial reading immediately
    sendReadings();

    let interval = setInterval(sendReadings, intervalMs);

    // Allow client to configure interval
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "set_interval" && typeof msg.intervalMs === "number") {
          const newInterval = Math.max(1000, Math.min(msg.intervalMs, 60000));
          clearInterval(interval);
          intervalMs = newInterval;
          interval = setInterval(sendReadings, intervalMs);
          ws.send(
            JSON.stringify({
              type: "interval_updated",
              intervalMs: newInterval,
            }),
          );
        }
      } catch {
        // Ignore invalid messages
      }
    });

    ws.on("close", () => {
      clearInterval(interval);
    });
  });

  console.log("WebSocket sensor server attached at /ws/sensors");
}
