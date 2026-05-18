import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";

export class NotificationRouter {
  public router = Router();

  constructor(private notificationController: NotificationController) {
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.get("/:id/notifications", (req, res) =>
      this.notificationController.getNotifications(req, res),
    );
  }
}
