import { Request, Response } from "express";
import { HomeService } from "../application/HomeService";
import { ComponentStateSerializer } from "./ComponentStateSerializer";
import { NotificationInboundPort } from "../../notification-context/application/NotificationInboundPort";

// Extends Express Request to include user information from auth middleware
type AuthenticatedRequest = Request & {
  user?: {
    username?: string;
    role?: string;
  };
};

export class HomeController {
  private stateSerializer = new ComponentStateSerializer();

  constructor(
    private homeService: HomeService,
    private notificationPort?: NotificationInboundPort,
  ) {}

  async getComponents(req: Request, res: Response) {
    try {
      const components = await this.homeService.getComponents(
        req.params.id as string,
      );
      res.json(components);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async addComponent(req: Request, res: Response) {
    try {
      const { roomId, ...componentData } = req.body;
      const component = await this.homeService.addComponent(
        req.params.id as string,
        roomId,
        componentData,
      );
      res.status(201).json(component);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async getComponentTypes(req: Request, res: Response) {
    try {
      const types = await this.homeService.getComponentTypes();
      res.json(types);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async getComponentsByType(req: Request, res: Response) {
    try {
      const components = await this.homeService.getComponentsByType(
        req.params.id as string,
        req.params.type as string,
      );
      res.json(components);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async getComponent(req: Request, res: Response) {
    try {
      const component = await this.homeService.getComponent(
        req.params.id as string,
        req.params.componentId as string,
      );
      if (!component)
        return res.status(404).json({ error: "Component not found" });

      res.json(component.accept(this.stateSerializer));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async executeAction(req: Request, res: Response) {
    try {
      const component = await this.homeService.executeAction(
        req.params.id as string,
        req.params.componentId as string,
        req.params.action as string,
      );

      const user = (req as AuthenticatedRequest).user;

      // Generate an event for the notification system
      if (user?.username && user.role && this.notificationPort) {
        try {
          await this.notificationPort.notifyComponentAction(
            req.params.id as string,
            {
              componentId: component.id,
              componentName: component.name,
              action: req.params.action as string,
              actor: {
                username: user.username,
                role: user.role,
              },
            },
          );
        } catch (error) {
          console.error("Notification delivery failed", error);
        }
      }

      res.json(component);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async getSensorTypes(req: Request, res: Response) {
    try {
      const types = await this.homeService.getSensorTypes();
      res.json(types);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
