import { Router, Request, Response } from "express";
import { HomeService } from "../application/home-service";
import { authMiddleware } from "../../auth-middleware";

export function createHomeRoutes(homeService: HomeService): Router {
  const router = Router();

  // All home routes require authentication
  router.use(authMiddleware);

  // GET /:homeId/components — list all components for a home
  router.get("/:homeId/components", async (req: Request, res: Response) => {
    const homeId = req.params.homeId as string;

    // Verify the JWT homeId matches the requested homeId
    if (req.user?.homeId !== homeId) {
      res.status(403).json({ error: "You do not have access to this home" });
      return;
    }

    const components = await homeService.getComponents(homeId);
    res.json({ components });
  });

  // PATCH /:homeId/components/:componentId — update component status
  router.patch(
    "/:homeId/components/:componentId",
    async (req: Request, res: Response) => {
      const homeId = req.params.homeId as string;
      const componentId = req.params.componentId as string;
      const { status } = req.body;

      if (req.user?.homeId !== homeId) {
        res.status(403).json({ error: "You do not have access to this home" });
        return;
      }

      if (!status) {
        res.status(400).json({ error: "Status is required" });
        return;
      }

      const updated = await homeService.updateComponentStatus(
        componentId,
        homeId,
        status,
      );

      if (!updated) {
        res.status(404).json({ error: "Component not found" });
        return;
      }

      res.json({ component: updated });
    },
  );

  return router;
}
