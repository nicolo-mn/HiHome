import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { RuleController } from "./RuleController";
import { Rule } from "../../domain/Rule";

describe("RuleController", () => {
  let ruleService: any;
  let ruleController: RuleController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    ruleService = {
      getRulesForHome: vi.fn(),
      addRule: vi.fn(),
      deleteRule: vi.fn(),
      reorderRules: vi.fn(),
    };
    ruleController = new RuleController(ruleService as any);

    req = {
      params: { id: "home-1", ruleId: "rule-1" },
      body: {},
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe("getRules", () => {
    //TODO: consider removing
    it("should return rules", async () => {
      const mockRules: Rule[] = [];
      // Simulating a fix for the controller assuming it returns an array of rules
      ruleService.getRulesForHome.mockResolvedValue(mockRules);

      await ruleController.getRules(req as Request, res as Response);

      expect(ruleService.getRulesForHome).toHaveBeenCalledWith("home-1");
      expect(res.json).toHaveBeenCalledWith({ rules: mockRules });
    });

    it("should handle errors received by getRulesForHome", async () => {
      ruleService.getRulesForHome.mockRejectedValue(new Error("Not found"));

      await ruleController.getRules(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
    });
  });

  describe("addRule", () => {
    it("should add a weather rule", async () => {
      req.body = {
        ruleName: "Rainy Rule",
        observableId: "weather",
        operatorTarget: "Rain",
        actions: [
          { deviceType: "light", command: "turnOn", deviceId: "comp-1" },
        ],
      };

      ruleService.addRule.mockResolvedValue({ id: "new-rule-id" });

      await ruleController.addRule(req as Request, res as Response);

      expect(ruleService.addRule).toHaveBeenCalledWith(
        expect.objectContaining({
          homeId: "home-1",
          ruleName: "Rainy Rule",
          observableId: "weather",
          operatorTarget: "Rain",
          actions: [
            {
              deviceType: "light",
              command: "turnOn",
              deviceId: "comp-1",
            },
          ],
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ ruleId: "new-rule-id" });
    });

    it("should add a numeric rule", async () => {
      req.body = {
        ruleName: "Temp Rule",
        observableId: "external-thermometer",
        operator: "gt",
        operatorTarget: "25",
        actions: [
          { deviceType: "window", command: "open", deviceId: "comp-2" },
        ],
      };

      ruleService.addRule.mockResolvedValue({ id: "new-rule-id" });

      await ruleController.addRule(req as Request, res as Response);

      expect(ruleService.addRule).toHaveBeenCalledWith(
        expect.objectContaining({
          homeId: "home-1",
          ruleName: "Temp Rule",
          observableId: "external-thermometer",
          operator: "gt",
          operatorTarget: "25",
          actions: [
            {
              deviceType: "window",
              command: "open",
              deviceId: "comp-2",
            },
          ],
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should add a thermostat rule", async () => {
      req.body = {
        ruleName: "Thermo Rule",
        observableId: "internal-thermometer",
        operator: "lt",
        operatorTarget: "20",
        actions: [
          {
            deviceType: "thermostat",
            command: "setTemperature",
            deviceId: "comp-3",
            targetTemp: "22",
          },
        ],
      };

      ruleService.addRule.mockResolvedValue({ id: "new-rule-id" });

      await ruleController.addRule(req as Request, res as Response);

      expect(ruleService.addRule).toHaveBeenCalledWith(
        expect.objectContaining({
          homeId: "home-1",
          ruleName: "Thermo Rule",
          observableId: "internal-thermometer",
          operator: "lt",
          operatorTarget: "20",
          actions: [
            {
              deviceType: "thermostat",
              command: "setTemperature",
              deviceId: "comp-3",
              targetTemp: "22",
            },
          ],
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("deleteRule", () => {
    it("should delete a rule", async () => {
      await ruleController.deleteRule(req as Request, res as Response);

      expect(ruleService.deleteRule).toHaveBeenCalledWith("rule-1");
      expect(res.json).toHaveBeenCalledWith({
        message: "Rule deleted successfully",
      });
    });

    it("should handle not found rule errors", async () => {
      ruleService.deleteRule.mockRejectedValue(new Error("Rule not found"));

      await ruleController.deleteRule(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Rule not found" });
    });
  });

  describe("reorderRules", () => {
    it("should reorder rules", async () => {
      req.body = { ruleIds: ["r2", "r1", "r3"] };

      await ruleController.reorderRules(req as Request, res as Response);

      expect(ruleService.reorderRules).toHaveBeenCalledWith("home-1", [
        "r2",
        "r1",
        "r3",
      ]);
      expect(res.json).toHaveBeenCalledWith({
        message: "Rules reordered successfully",
      });
    });

    it("should handle invalid permutation errors", async () => {
      req.body = { ruleIds: ["r1"] };
      ruleService.reorderRules.mockRejectedValue(
        new Error("Reorder must include every rule of the home exactly once"),
      );

      await ruleController.reorderRules(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Reorder must include every rule of the home exactly once",
      });
    });
  });
});
