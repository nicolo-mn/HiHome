import { Request, Response } from "express";
import { RuleService } from "../application/RuleService";
import { RuleTrigger } from "../domain/Entities";
import { RuleFactory } from "../domain/RuleFactory";

export class RuleController {
  constructor(private ruleService: RuleService) {}

  async getRules(req: Request, res: Response) {
    try {
      const [catalog, rules] = await this.ruleService.getRules(
        req.params.id as string,
      );
      res.json({ catalog, rules });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async addRule(req: Request, res: Response) {
    try {
      const homeId = req.params.id as string;
      const ruleName = req.body.name as string;
      // TODO: move to middleware
      // Why is typeof checked if req.body.name is already cast to string?
      if (!ruleName || typeof ruleName !== "string") {
        res.status(400).json({ error: "Invalid rule name" });
        return;
      }

      const triggerInput = {
        observableId: req.body.observableId,
        operator: req.body.operator,
        value: req.body.value,
      };

      // Same as above, why is typeof checked if triggerInput properties are already cast to expected types?
      if (!triggerInput || typeof triggerInput !== "object") {
        res.status(400).json({ error: "Invalid trigger" });
        return;
      }

      const { observableId, operator, value } = triggerInput as {
        observableId?: unknown;
        operator?: unknown;
        value?: unknown;
      };

      const isValidOperator =
        operator === "gt" ||
        operator === "lt" ||
        operator === "gte" ||
        operator === "lte" ||
        operator === "eq" ||
        operator === "is";

      if (typeof observableId !== "string" || !isValidOperator) {
        res.status(400).json({ error: "Invalid trigger" });
        return;
      }

      if (typeof value !== "number" && typeof value !== "string") {
        res.status(400).json({ error: "Invalid trigger value" });
        return;
      }

      const rawActions = req.body.actions;
      if (!Array.isArray(rawActions) || rawActions.length === 0) {
        res.status(400).json({ error: "Invalid actions" });
        return;
      }

      const actions = rawActions.map((a: any) => {
        if (
          !a ||
          typeof a.componentId !== "string" ||
          typeof a.capabilityId !== "string" ||
          typeof a.commandId !== "string"
        ) {
          throw new Error("Invalid action");
        }

        if (a.params !== undefined) {
          if (typeof a.params !== "object" || Array.isArray(a.params)) {
            throw new Error("Invalid action params");
          }
          for (const value of Object.values(
            a.params as Record<string, unknown>,
          )) {
            if (typeof value !== "number") {
              throw new Error("Invalid action params");
            }
          }
        }

        return RuleFactory.createAction(
          a.componentId,
          a.capabilityId,
          a.commandId,
          a.params as Record<string, number>,
        );
      });

      const trigger = RuleFactory.createTrigger(
        observableId,
        operator as RuleTrigger["operator"],
        value,
      );

      const created = await this.ruleService.addRule(
        homeId,
        ruleName,
        trigger,
        actions,
      );
      res.status(201).json({ rule: created });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async deleteRule(req: Request, res: Response) {
    try {
      await this.ruleService.deleteRule(req.params.ruleId as string);
      res.json({ message: "Rule deleted successfully" });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }
}
