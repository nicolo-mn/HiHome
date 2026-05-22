import { Router } from "express";
import { PreferencesController } from "../controllers/PreferencesController";
import { homeIdByHomeIdMiddleware } from "../../../home-context/infrastructure/middlewares/RoutesMiddlewares";

export class PreferencesRouter {
  public router = Router();

  constructor(controller: PreferencesController) {
    this.router.get(
      "/:homeId/users/me/preferences",
      homeIdByHomeIdMiddleware,
      (req, res) => controller.getPreferences(req, res),
    );
    this.router.put(
      "/:homeId/users/me/preferences",
      homeIdByHomeIdMiddleware,
      (req, res) => controller.updatePreferences(req, res),
    );
  }
}
