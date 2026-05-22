import { Request, Response, Router } from "express";
import { HomeController } from "../controllers/HomeController";
import { homeIdMiddleware } from "../middlewares/RoutesMiddlewares";
import { adminMiddleware } from "../../../shared/middlewares/AdminMiddleware";
import { HomeService } from "../../application/HomeService";
import {
  componentIdValidator,
  temperatureValidator,
} from "../middlewares/ComponentValidator";

export class HomeRouter {
  public router = Router();

  constructor(private homeController: HomeController) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.use("/:id", homeIdMiddleware);
    this.router.get("/:id/components/types", (req: Request, res: Response) =>
      this.homeController.getComponentTypes(req, res),
    );
    this.router.get(
      "/:id/components/types/:type",
      (req: Request, res: Response) =>
        this.homeController.getComponentsByType(req, res),
    );
    this.router.get("/:id/components", (req: Request, res: Response) =>
      this.homeController.getComponents(req, res),
    );
    this.router.get(
      "/:id/components/events",
      adminMiddleware,
      (req: Request, res: Response) =>
        this.homeController.getComponentEvents(req, res),
    );
    this.router.post(
      "/:id/components",
      adminMiddleware,
      (req: Request, res: Response) =>
        this.homeController.addComponent(req, res),
    );
    this.router.get(
      "/:id/components/:componentId",
      componentIdValidator,
      (req: Request, res: Response) =>
        this.homeController.getComponent(req, res),
    );
    this.router.post(
      "/:id/components/:componentId/:action",
      componentIdValidator,
      temperatureValidator,
      (req: Request, res: Response) => {
        this.homeController.executeAction(req, res);
      },
    );
    this.router.get("/:id/hourly-temperatures", (req, res) =>
      this.homeController.getHourlyTemperatures(req, res),
    );
    this.router.put("/:id/hourly-temperatures", (req, res) =>
      this.homeController.setHourlyTemperatures(req, res),
    );
  }
}
