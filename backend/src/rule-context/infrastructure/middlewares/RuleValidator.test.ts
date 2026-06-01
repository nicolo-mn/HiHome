import { describe, it, expect } from "vitest";
import express, { Request, Response } from "express";
import request from "supertest";
import {
  actionsValidator,
  conditionValidator,
  namingAndOwnershipValidator,
  reorderValidator,
} from "./RuleValidator";

const ok = (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
};

const app = express();
app.use(express.json());
app.post("/:id/naming", namingAndOwnershipValidator, ok);
app.post("/condition", conditionValidator, ok);
app.post("/actions", actionsValidator, ok);
app.post("/reorder", reorderValidator, ok);

describe("namingAndOwnershipValidator", () => {
  it("accepts an integer id and a present ruleName", async () => {
    const res = await request(app)
      .post("/5/naming")
      .send({ ruleName: "My Rule" });
    expect(res.status).toBe(200);
  });

  it("rejects a non-integer id", async () => {
    const res = await request(app)
      .post("/abc/naming")
      .send({ ruleName: "My Rule" });
    expect(res.status).toBe(400);
  });

  it("rejects a missing ruleName", async () => {
    const res = await request(app).post("/5/naming").send({});
    expect(res.status).toBe(400);
  });
});

describe("conditionValidator", () => {
  it("accepts a numeric observable with a gt/lt/eq operator and numeric target", async () => {
    const res = await request(app).post("/condition").send({
      observableId: "indoor-thermometer",
      operator: "gt",
      operatorTarget: 22,
    });
    expect(res.status).toBe(200);
  });

  it.each(["rain", "cloudy"])(
    "accepts a weather observable with the 'is' operator and the %j target",
    async (operatorTarget) => {
      const res = await request(app)
        .post("/condition")
        .send({ observableId: "weather", operator: "is", operatorTarget });
      expect(res.status).toBe(200);
    },
  );

  it("rejects an unknown observableId", async () => {
    const res = await request(app)
      .post("/condition")
      .send({ observableId: "foo", operator: "gt", operatorTarget: 1 });
    expect(res.status).toBe(400);
  });

  it("rejects a numeric observable with a non gt/lt/eq operator", async () => {
    const res = await request(app)
      .post("/condition")
      .send({ observableId: "air-quality", operator: "is", operatorTarget: 5 });
    expect(res.status).toBe(400);
  });

  it("rejects a numeric observable with a non-numeric target", async () => {
    const res = await request(app).post("/condition").send({
      observableId: "wind-speed",
      operator: "gt",
      operatorTarget: "abc",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a weather observable with an operator other than 'is'", async () => {
    const res = await request(app).post("/condition").send({
      observableId: "weather",
      operator: "gt",
      operatorTarget: "rain",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a weather observable with a target outside the weather set", async () => {
    const res = await request(app).post("/condition").send({
      observableId: "weather",
      operator: "is",
      operatorTarget: "tornado",
    });
    expect(res.status).toBe(400);
  });
});

describe("actionsValidator", () => {
  it("accepts a valid light action", async () => {
    const res = await request(app)
      .post("/actions")
      .send({
        actions: [{ deviceId: "d1", deviceType: "light", command: "turnOn" }],
      });
    expect(res.status).toBe(200);
  });

  it("accepts a thermostat setTemperature with an in-range targetTemp", async () => {
    const res = await request(app)
      .post("/actions")
      .send({
        actions: [
          {
            deviceId: "t1",
            deviceType: "thermostat",
            command: "setTemperature",
            targetTemp: 22,
          },
        ],
      });
    expect(res.status).toBe(200);
  });

  it("rejects an empty actions array", async () => {
    const res = await request(app).post("/actions").send({ actions: [] });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown deviceType", async () => {
    const res = await request(app)
      .post("/actions")
      .send({
        actions: [{ deviceId: "d1", deviceType: "toaster", command: "x" }],
      });
    expect(res.status).toBe(400);
  });

  it("rejects a command that is not valid for the deviceType", async () => {
    const res = await request(app)
      .post("/actions")
      .send({
        actions: [{ deviceId: "d1", deviceType: "light", command: "open" }],
      });
    expect(res.status).toBe(400);
  });

  it("rejects setTemperature without a targetTemp", async () => {
    const res = await request(app)
      .post("/actions")
      .send({
        actions: [
          {
            deviceId: "t1",
            deviceType: "thermostat",
            command: "setTemperature",
          },
        ],
      });
    expect(res.status).toBe(400);
  });

  it("rejects a targetTemp outside [5, 40]", async () => {
    const res = await request(app)
      .post("/actions")
      .send({
        actions: [
          {
            deviceId: "t1",
            deviceType: "thermostat",
            command: "setTemperature",
            targetTemp: 99,
          },
        ],
      });
    expect(res.status).toBe(400);
  });

  it("rejects a targetTemp on a command other than setTemperature", async () => {
    const res = await request(app)
      .post("/actions")
      .send({
        actions: [
          {
            deviceId: "d1",
            deviceType: "light",
            command: "turnOn",
            targetTemp: 22,
          },
        ],
      });
    expect(res.status).toBe(400);
  });
});

describe("reorderValidator", () => {
  it("accepts a non-empty array of unique string ids", async () => {
    const res = await request(app)
      .post("/reorder")
      .send({ ruleIds: ["a", "b"] });
    expect(res.status).toBe(200);
  });

  it("rejects an empty array", async () => {
    const res = await request(app).post("/reorder").send({ ruleIds: [] });
    expect(res.status).toBe(400);
  });

  it("rejects duplicate ids", async () => {
    const res = await request(app)
      .post("/reorder")
      .send({ ruleIds: ["a", "a"] });
    expect(res.status).toBe(400);
  });

  it("rejects a non-string element", async () => {
    const res = await request(app)
      .post("/reorder")
      .send({ ruleIds: ["a", 5] });
    expect(res.status).toBe(400);
  });
});
