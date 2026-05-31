import { Router } from "express";
import { RuleController } from "../controllers/RuleController";
import {
  actionsValidator,
  conditionValidator,
  namingAndOwnershipValidator,
  reorderValidator,
  timeWindowValidator,
} from "../middlewares/RuleValidator";
import { adminMiddleware } from "../../../shared/middlewares/AdminMiddleware";

export class RuleRouter {
  public router = Router();

  constructor(private ruleController: RuleController) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.get("/:id/rules", adminMiddleware, (req, res) =>
      this.ruleController.getRules(req, res),
    );

    this.router.post(
      "/:id/rules",
      adminMiddleware,
      ...namingAndOwnershipValidator,
      ...conditionValidator,
      ...actionsValidator,
      ...timeWindowValidator,
      (req, res) => this.ruleController.addRule(req, res),
    );

    this.router.put(
      "/:id/rules/order",
      adminMiddleware,
      ...reorderValidator,
      (req, res) => this.ruleController.reorderRules(req, res),
    );

    this.router.delete("/:id/rules/:ruleId", adminMiddleware, (req, res) =>
      this.ruleController.deleteRule(req, res),
    );
  }
}
