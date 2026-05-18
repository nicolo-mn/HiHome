import { Router } from "express";
import { RuleController } from "../controllers/RuleController";

export class RuleRouter {
  public router = Router();

  constructor(private ruleController: RuleController) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.get("/:id/rules", (req, res) =>
      this.ruleController.getRules(req, res),
    );

    this.router.post("/:id/rules", (req, res) =>
      this.ruleController.addRule(req, res),
    );

    this.router.delete("/rules/:ruleId", (req, res) =>
      this.ruleController.deleteRule(req, res),
    );

    this.router.put("/:id/rules/order", (req, res) =>
      this.ruleController.reorderRules(req, res),
    );
  }
}
