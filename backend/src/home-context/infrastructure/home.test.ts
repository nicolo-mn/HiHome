import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { io as ioClient, Socket } from "socket.io-client";
import { default as app, server, io } from "../../index";

describe("Home Context Integration Tests", () => {
  let token: string;
  let port: number;

  beforeAll(async () => {
    const loginRes = await request(app).post("/api/login").send({
      username: "mockuser",
      houseId: "1",
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
  });

  describe("REST Endpoints", () => {
    it("should get component types", async () => {
      const res = await request(app)
        .get("/home-1/components/types")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toContain("light");
    });

    it("should list components for home-1", async () => {
      const res = await request(app)
        .get("/home-1/components")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("id", "light-1");
    });

    it("should add a new component", async () => {
      const res = await request(app)
        .post("/home-1/components")
        .set("Authorization", `Bearer ${token}`)
        .send({
          id: "light-3",
          name: "Kitchen Light",
          type: "light",
          roomId: "room-1",
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id", "light-3");
    });

    it("should turn on a light", async () => {
      // First ensure off
      let stateRes = await request(app)
        .get("/home-1/components/light-1")
        .set("Authorization", `Bearer ${token}`);
      expect(stateRes.body.isOn).toBe(false);

      const turnOnRes = await request(app)
        .post("/home-1/components/light-1/turnOn")
        .set("Authorization", `Bearer ${token}`);
      expect(turnOnRes.status).toBe(200);

      stateRes = await request(app)
        .get("/home-1/components/light-1")
        .set("Authorization", `Bearer ${token}`);
      expect(stateRes.body.isOn).toBe(true);
    });

    it("should turn off a light", async () => {
      const turnOffRes = await request(app)
        .post("/home-1/components/light-1/turnOff")
        .set("Authorization", `Bearer ${token}`);
      expect(turnOffRes.status).toBe(200);

      const stateRes = await request(app)
        .get("/home-1/components/light-1")
        .set("Authorization", `Bearer ${token}`);
      expect(stateRes.body.isOn).toBe(false);
    });

    it("should list sensor types", async () => {
      const res = await request(app)
        .get("/home-1/sensors/types")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toContain("thermometer");
    });

    it("should get components by type", async () => {
      const res = await request(app)
        .get("/home-1/components/types/light")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      // Removed .type check since the domain refactor removed the arbitrary type property
      // check that we actually got back light components
      expect(res.body[0]).toHaveProperty("state");
      expect(res.body[0].state).toHaveProperty("isOn");
    });
  });

  describe("Socket.IO Sensor Updates", () => {
    it("should receive sensor updates via socket.io", async () => {
      return new Promise<void>((resolve, reject) => {
        const socket: Socket = ioClient(`http://localhost:${port}`, {
          query: { homeId: "1" },
        });

        socket.on("sensorUpdate", (data) => {
          try {
            expect(data.sensorId).toBeDefined();
            expect(data.type).toBe("thermometer");
            expect(data.value).toBeDefined();
            expect(typeof data.value.temperature).toBe("number");
            socket.close();
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        socket.on("connect_error", (e) => {
          reject(e);
        });

        // Timeout fallback
        setTimeout(() => {
          socket.close();
          reject(new Error("Socket.io test timeout"));
        }, 5000);
      });
    });
  });
});
