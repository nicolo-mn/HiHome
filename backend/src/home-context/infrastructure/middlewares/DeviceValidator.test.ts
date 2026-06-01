import { describe, it, expect } from "vitest";
import express, { Request, Response } from "express";
import request from "supertest";
import { deviceIdValidator, temperatureValidator } from "./DeviceValidator";

// Minimal app mounting the validator chains on representative routes so the
// express-validator middleware runs exactly as it does in production.
const app = express();
app.use(express.json());
app.post(
  "/action/:action",
  temperatureValidator,
  (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  },
);
app.get(
  "/device/:deviceId",
  deviceIdValidator,
  (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  },
);

describe("temperatureValidator (action === setTemperature)", () => {
  it("accepts a numeric temperature within [5, 40]", async () => {
    const res = await request(app).post("/action/setTemperature").send({
      temperature: 22,
    });
    expect(res.status).toBe(200);
  });

  it.each([
    ["above the maximum", { temperature: 50 }],
    ["below the minimum", { temperature: 3 }],
    ["not numeric", { temperature: "abc" }],
    ["missing", {}],
  ])("rejects a temperature %s", async (_label, body) => {
    const res = await request(app).post("/action/setTemperature").send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("temperatureValidator (action !== setTemperature)", () => {
  it("rejects a temperature when the action is not setTemperature", async () => {
    const res = await request(app).post("/action/turnOn").send({
      temperature: 22,
    });
    expect(res.status).toBe(400);
  });

  it("accepts a request with no temperature for other actions", async () => {
    const res = await request(app).post("/action/turnOn").send({});
    expect(res.status).toBe(200);
  });
});

describe("deviceIdValidator", () => {
  it("accepts a present deviceId", async () => {
    const res = await request(app).get("/device/light-1");
    expect(res.status).toBe(200);
  });
});
