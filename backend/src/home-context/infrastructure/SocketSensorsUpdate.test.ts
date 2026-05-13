import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { io as ioClient, Socket } from "socket.io-client";
import type { Server as HttpServer } from "http";
import type { Server as SocketIOServer } from "socket.io";
import type { Express } from "express";

let app: Express;
let server: HttpServer;
let io: SocketIOServer;

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("End-to-end socket client test to check sensor updates", () => {
  let token: string;
  let port: number;

  beforeAll(async () => {
    process.env.EXTERNAL_SENSORS_POLL_INTERVAL_MS = "200";
    // mocks the ext-api-service response
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        temperature: 18.5,
        weatherType: 0,
        windSpeed: 4.2,
        windDirection: 120,
        precipitation: 0,
        europeanAqi: 12,
      }),
    } as Response);

    // executes the server
    const mod = await import("../../index");
    app = mod.default as Express;
    server = mod.server as HttpServer;
    io = mod.io as SocketIOServer;

    const loginRes = await request(app).post("/api/login").send({
      username: "mockuser",
      homeId: "1",
      password: "mockpassword",
    });
    token = loginRes.body.token;

    await new Promise<void>((resolve) => {
      server.listen(() => {
        port = (server.address() as any).port;
        resolve();
      });
    });
  });

  afterAll(() => {
    io.close();
    vi.restoreAllMocks();
  });

  it("emits external sensor updates to connected clients", async () => {
    await new Promise<void>((resolve, reject) => {
      const socket: Socket = ioClient(`http://localhost:${port}`, {
        auth: { token: `Bearer ${token}` },
        query: { homeId: "1" },
      });

      const received = new Set<string>(); // keep track of received events
      let timeout: NodeJS.Timeout | null = null;

      // wait until all 4 expected events are received, then resolve the test
      const onDone = () => {
        if (received.size === 4) {
          if (timeout) {
            clearTimeout(timeout);
          }
          socket.close();
          resolve();
        }
      };

      socket.once("connect", () => {
        timeout = setTimeout(() => {
          socket.close();
          reject(new Error("Socket.io external sensors test timeout"));
        }, 8000); // fail if not all events are received within 8 seconds
      });

      socket.once("sensor:external-temperature", (data) => {
        expect(data.temperature).toBe(18.5);
        received.add("sensor:external-temperature");
        onDone();
      });

      socket.once("sensor:air-quality", (data) => {
        expect(data.AQI).toBe(12);
        received.add("sensor:air-quality");
        onDone();
      });

      socket.once("sensor:wind", (data) => {
        expect(data.windSpeed).toBe(4.2);
        expect(data.windDirection).toBe(120);
        received.add("sensor:wind");
        onDone();
      });

      socket.once("sensor:weather", (data) => {
        expect(data.forecast).toBe(0);
        received.add("sensor:weather");
        onDone();
      });

      socket.once("connect_error", (error) => {
        if (timeout) {
          clearTimeout(timeout);
        }
        socket.close();
        reject(error);
      });
    });
  }, 10000);
});
