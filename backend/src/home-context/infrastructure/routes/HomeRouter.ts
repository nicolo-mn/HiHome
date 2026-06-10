import { Request, Response, Router } from "express";
import { HomeController } from "../controllers/HomeController";
import { UsageController } from "../controllers/UsageController";
import { homeIdMiddleware } from "../middlewares/RoutesMiddlewares";
import { adminMiddleware } from "../../../shared/middlewares/AdminMiddleware";
import {
  deviceIdValidator,
  temperatureValidator,
} from "../middlewares/DeviceValidator";

export class HomeRouter {
  public router = Router();

  constructor(
    private homeController: HomeController,
    private usageController: UsageController,
  ) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.use("/:id", homeIdMiddleware);
    this.router.get("/:id/rooms", (req: Request, res: Response) =>
      this.homeController.getRooms(req, res),
    );
    this.router.get("/:id/devices/types/:type", (req: Request, res: Response) =>
      this.homeController.getDevicesByType(req, res),
    );
    this.router.get("/:id/devices", (req: Request, res: Response) =>
      this.homeController.getDevices(req, res),
    );
    this.router.get(
      "/:id/devices/events",
      adminMiddleware,
      (req: Request, res: Response) =>
        this.homeController.getDeviceEvents(req, res),
    );
    this.router.post(
      "/:id/devices",
      adminMiddleware,
      (req: Request, res: Response) => this.homeController.addDevice(req, res),
    );
    this.router.get(
      "/:id/devices/:deviceId",
      deviceIdValidator,
      (req: Request, res: Response) => this.homeController.getDevice(req, res),
    );
    this.router.put(
      "/:id/devices/:deviceId",
      adminMiddleware,
      deviceIdValidator,
      (req: Request, res: Response) =>
        this.homeController.updateDevice(req, res),
    );
    this.router.delete(
      "/:id/devices/:deviceId",
      adminMiddleware,
      deviceIdValidator,
      (req: Request, res: Response) =>
        this.homeController.deleteDevice(req, res),
    );
    this.router.post(
      "/:id/devices/:deviceId/:action",
      deviceIdValidator,
      temperatureValidator,
      (req: Request, res: Response) => {
        this.homeController.executeAction(req, res);
      },
    );
    this.router.get("/:id/location-name", (req: Request, res: Response) =>
      this.homeController.getLocationName(req, res),
    );
    this.router.get("/:id/hourly-temperatures", (req, res) =>
      this.homeController.getHourlyTemperatures(req, res),
    );
    this.router.get("/:id/usage", (req, res) => {
      this.usageController.getUsage(req, res);
    });
    this.router.put("/:id/hourly-temperatures", (req, res) =>
      this.homeController.setHourlyTemperatures(req, res),
    );
  }
}
