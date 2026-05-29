import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "./index";

describe("Backend Routes (Integration with Supertest)", () => {
  let token: string;

  beforeAll(async () => {
    // Generate token via login
    const loginRes = await request(app).post("/api/v1/login").send({
      username: "mockuser",
      homeId: "1",
      password: "mockpassword",
    });
    token = loginRes.body.token;
  });

  it("GET /api/v1/health should return ok status without token", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body).toHaveProperty("db");
  });

  it("POST /api/v1/login should return 400 when missing required fields", async () => {
    const response = await request(app).post("/api/v1/login").send({
      homeId: "1",
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
});
