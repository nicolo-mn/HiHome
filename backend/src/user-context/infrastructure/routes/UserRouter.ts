import { Router } from "express";
import { UserManagementController } from "../controllers/UserManagementController";
import { adminMiddleware } from "../../../shared/middlewares/AdminMiddleware";
import { homeIdMiddleware } from "../../../home-context/infrastructure/middlewares/RoutesMiddlewares";

export class UserRouter {
  public router = Router();

  constructor(controller: UserManagementController) {
    this.router.get(
      "/:id/users",
      adminMiddleware,
      homeIdMiddleware,
      (req, res) => controller.getUsers(req, res),
    );

    this.router.put(
      "/:id/users/:userId/role",
      adminMiddleware,
      homeIdMiddleware,
      (req, res) => controller.changeRole(req, res),
    );
  }
}
