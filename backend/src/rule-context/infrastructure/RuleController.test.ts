import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../index";

describe("RuleController", () => {
  let token: string;

  // TODO: turnOn doesn't have duration
  // add checks for invalid action params (non-number, array, etc.)
  const validRulePayload = {
    name: "Temp High",
    trigger: {
      observableId: "sensor-1",
      operator: "gt",
      value: 25,
    },
    actions: [
      {
        componentId: "light-1",
        capabilityId: "toggle",
        commandId: "turnOn",
        params: { duration: 5 },
      },
    ],
  };

  // login before each test
  beforeAll(async () => {
    const loginRes = await request(app).post("/api/login").send({
      username: "mockuser",
      homeId: "1",
      password: "mockpassword",
    });
    token = loginRes.body.token;
  });

  describe("GET /api/home/:id/rules", () => {
    it("returns 200 with catalog and rules array", async () => {
      const res = await request(app)
        .get("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("catalog");
      expect(res.body).toHaveProperty("rules");
      expect(Array.isArray(res.body.rules)).toBe(true);
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/home/1/rules");
      expect(res.status).toBe(401);
    });

    it("returns 404 for a non-existent home", async () => {
      const res = await request(app)
        .get("/api/home/non-existent-home/rules")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/home/:id/rules", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .send(validRulePayload);

      expect(res.status).toBe(401);
    });

    it("creates a rule", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send(validRulePayload);

      expect(res.status).toBe(201);
      expect(res.body.rule).toMatchObject({
        homeId: "1",
        name: "Temp High",
        enabled: true,
        trigger: { observableId: "sensor-1", operator: "gt", value: 25 },
        actions: [
          {
            componentId: "light-1",
            capabilityId: "toggle",
            commandId: "turnOn",
            params: { duration: 5 },
          },
        ],
      });
    });

    it("creates a rule using flat trigger fields (legacy payload)", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Legacy Trigger",
          observableId: "sensor-2",
          operator: "lt",
          value: 10,
          actions: [
            {
              componentId: "light-2",
              capabilityId: "toggle",
              commandId: "turnOff",
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.rule.trigger).toMatchObject({
        observableId: "sensor-2",
        operator: "lt",
        value: 10,
      });
    });

    it("creates a rule with a string trigger value", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "String Value Rule",
          trigger: {
            observableId: "sensor-1",
            operator: "is",
            value: "active",
          },
          actions: [
            {
              componentId: "light-1",
              capabilityId: "toggle",
              commandId: "turnOn",
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.rule.trigger.value).toBe("active");
    });

    it("creates a rule with an action that has no params", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "No Params Rule",
          trigger: { observableId: "sensor-1", operator: "eq", value: 1 },
          actions: [
            {
              componentId: "light-1",
              capabilityId: "toggle",
              commandId: "turnOn",
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.rule.actions[0].params).toBeUndefined();
    });

    it("creates a rule with multiple actions", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Multi Action Rule",
          trigger: { observableId: "sensor-1", operator: "gte", value: 30 },
          actions: [
            {
              componentId: "light-1",
              capabilityId: "toggle",
              commandId: "turnOn",
            },
            {
              componentId: "fan-1",
              capabilityId: "speed",
              commandId: "setSpeed",
              params: { level: 3 },
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.rule.actions).toHaveLength(2);
    });

    it("newly created rule appears in the rules list", async () => {
      const createRes = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send(validRulePayload);

      const listRes = await request(app)
        .get("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`);

      const ids = listRes.body.rules.map((r: { id: string }) => r.id);
      expect(ids).toContain(createRes.body.rule.id);
    });

    // rule name validation

    it("rejects rule creation without a name", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validRulePayload, name: undefined });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/rule name/i);
    });

    it("rejects rule creation when name is not a string", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validRulePayload, name: 42 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/rule name/i);
    });

    // trigger validation

    it("rejects rule creation without actions", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Missing Actions",
          trigger: { observableId: "sensor-1", operator: "gt", value: 30 },
        });

      expect(res.status).toBe(400);
    });

    it("rejects when trigger observableId is missing", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          trigger: { operator: "gt", value: 25 },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/trigger/i);
    });

    it("rejects when trigger operator is invalid", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          trigger: { observableId: "sensor-1", operator: "neq", value: 25 },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/trigger/i);
    });

    it("rejects when trigger value is boolean", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          trigger: { observableId: "sensor-1", operator: "gt", value: true },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/trigger value/i);
    });

    it("rejects when trigger value is null", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          trigger: { observableId: "sensor-1", operator: "gt", value: null },
        });

      expect(res.status).toBe(400);
    });

    it("rejects when trigger value is an array", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          trigger: { observableId: "sensor-1", operator: "gt", value: [25] },
        });

      expect(res.status).toBe(400);
    });

    // action validation

    it("rejects with an empty actions array", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validRulePayload, actions: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/actions/i);
    });

    it("rejects when actions is not an array", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...validRulePayload, actions: "turnOn" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/actions/i);
    });

    it("rejects when an action is missing componentId", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          actions: [{ capabilityId: "toggle", commandId: "turnOn" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/action/i);
    });

    it("rejects when an action is missing capabilityId", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          actions: [{ componentId: "light-1", commandId: "turnOn" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/action/i);
    });

    it("rejects when an action is missing commandId", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          actions: [{ componentId: "light-1", capabilityId: "toggle" }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/action/i);
    });

    it("rejects when action params contains a non-number value", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          actions: [
            {
              componentId: "light-1",
              capabilityId: "toggle",
              commandId: "turnOn",
              params: { duration: "long" },
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/params/i);
    });

    it("rejects when action params is an array instead of object", async () => {
      const res = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validRulePayload,
          actions: [
            {
              componentId: "light-1",
              capabilityId: "toggle",
              commandId: "turnOn",
              params: [5],
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/params/i);
    });

    // TODO: not all operators are suited for each observable type
    it.each(["gt", "lt", "gte", "lte", "eq", "is"])(
      "accepts operator '%s'",
      async (operator) => {
        const res = await request(app)
          .post("/api/home/1/rules")
          .set("Authorization", `Bearer ${token}`)
          .send({
            ...validRulePayload,
            name: `Rule with ${operator}`,
            trigger: { observableId: "sensor-1", operator, value: 10 },
          });

        expect(res.status).toBe(201);
      },
    );
  });

  describe("DELETE /api/home/:id/rules/:ruleId", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app).delete("/api/home/1/rules/some-id");
      expect(res.status).toBe(401);
    });

    it("deletes an existing rule", async () => {
      const createRes = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send(validRulePayload);

      const ruleId = createRes.body.rule.id;

      const deleteRes = await request(app)
        .delete(`/api/home/1/rules/${ruleId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/deleted/i);
    });

    it("deleted rule no longer appears in the list", async () => {
      const createRes = await request(app)
        .post("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`)
        .send(validRulePayload);

      const ruleId = createRes.body.rule.id;

      await request(app)
        .delete(`/api/home/1/rules/${ruleId}`)
        .set("Authorization", `Bearer ${token}`);

      const listRes = await request(app)
        .get("/api/home/1/rules")
        .set("Authorization", `Bearer ${token}`);

      const ids = listRes.body.rules.map((r: { id: string }) => r.id);
      expect(ids).not.toContain(ruleId);
    });

    it("returns 404 when deleting a non-existent rule", async () => {
      const res = await request(app)
        .delete("/api/home/1/rules/does-not-exist")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
