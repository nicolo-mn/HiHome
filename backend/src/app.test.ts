import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "./index";

describe("Backend Routes (Integration with Supertest)", () => {
  let token: string;

  beforeAll(async () => {
    // Generate token via login
    const loginRes = await request(app).post("/api/login").send({
      username: "mockuser",
      houseId: "1",
      password: "mockpassword",
    });
    token = loginRes.body.token;
  });

  it("GET /api/health should return ok status without token", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body).toHaveProperty("db");
  });

  it("GET / should return hello message when authenticated", async () => {
    const response = await request(app)
      .get("/")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Protected: Hello from MEVN backend!",
    });
  });

  it("GET / should return 401 when not authenticated", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(401);
  });

  it("POST /api/login should return 400 when missing required fields", async () => {
    const response = await request(app).post("/api/login").send({
      houseId: "house1",
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
