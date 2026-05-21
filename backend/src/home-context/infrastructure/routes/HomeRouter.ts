import { Router } from "express";
import { HomeController } from "../controllers/HomeController";
import { homeIdMiddleware } from "../middlewares/RoutesMiddlewares";
import { adminMiddleware } from "../../../shared/middlewares/AdminMiddleware";

export class HomeRouter {
  public router = Router();

  constructor(private homeController: HomeController) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.use("/:id", homeIdMiddleware);
    this.router.get("/:id/components/types", (req, res) =>
      this.homeController.getComponentTypes(req, res),
    );
    this.router.get("/:id/components/types/:type", (req, res) =>
      this.homeController.getComponentsByType(req, res),
    );
    this.router.get("/:id/components", (req, res) =>
      this.homeController.getComponents(req, res),
    );
    this.router.post("/:id/components", adminMiddleware, (req, res) =>
      this.homeController.addComponent(req, res),
    );
    this.router.get("/:id/components/:componentId", (req, res) =>
      this.homeController.getComponent(req, res),
    );
    this.router.post("/:id/components/:componentId/:action", (req, res) => {
      this.homeController.executeAction(req, res);
    });
  }
}
