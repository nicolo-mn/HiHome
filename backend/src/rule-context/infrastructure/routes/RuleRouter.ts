import { Router } from "express";
import { RuleController } from "../controllers/RuleController";
import {
  actionsValidator,
  conditionValidator,
  namingAndOwnershipValidator,
  reorderValidator,
} from "../middlewares/RuleValidator";
import { canManageRules } from "../middlewares/RuleAuthorization";

export class RuleRouter {
  public router = Router();

  constructor(private ruleController: RuleController) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.get("/:id/rules", canManageRules, (req, res) =>
      this.ruleController.getRules(req, res),
    );

    this.router.post(
      "/:id/rules",
      canManageRules,
      ...namingAndOwnershipValidator,
      ...conditionValidator,
      ...actionsValidator,
      (req, res) => this.ruleController.addRule(req, res),
    );

    this.router.put(
      "/:id/rules/order",
      canManageRules,
      ...reorderValidator,
      (req, res) => this.ruleController.reorderRules(req, res),
    );

    this.router.delete("/:id/rules/:ruleId", canManageRules, (req, res) =>
      this.ruleController.deleteRule(req, res),
    );
  }
}
