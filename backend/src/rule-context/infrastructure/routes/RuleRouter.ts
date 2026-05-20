import { Router } from "express";
import { RuleController } from "../controllers/RuleController";
import { reorderValidator } from "../middlewares/RuleValidator";

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

    this.router.put("/:id/rules/order", ...reorderValidator, (req, res) =>
      this.ruleController.reorderRules(req, res),
    );

    this.router.delete("/:id/rules/:ruleId", (req, res) =>
      this.ruleController.deleteRule(req, res),
    );
  }
}
