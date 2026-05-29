import { Request, Response } from "express";
import { HomeService } from "../../application/services/HomeService";
import { ComponentStateSerializer } from "../ComponentStateSerializer";
import { HomeNotificationOutboundPort } from "../../application/ports/HomeNotificationPort";
import { CreateComponentInput } from "../../application/dtos/ComponentDTO";
import { ComponentTypes } from "../../domain";

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
    private notificationPort?: HomeNotificationOutboundPort,
  ) {}

  async getComponents(req: Request, res: Response) {
    try {
      const items = await this.homeService.getComponentsWithRoomNames(
        req.params.id as string,
      );
      res.json(
        items.map(({ component, roomName }) => ({
          ...component.accept(this.stateSerializer),
          roomName,
        })),
      );
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async getRooms(req: Request, res: Response) {
    try {
      const rooms = await this.homeService.getRooms(req.params.id as string);
      res.json(rooms.map((r) => ({ id: r.id, name: r.name })));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async addComponent(req: Request, res: Response) {
    const input = this.parseCreateComponentInput(req.body);
    if ("error" in input) {
      return res.status(400).json({ error: input.error });
    }

    try {
      const component = await this.homeService.addComponent(
        req.params.id as string,
        input,
      );
      res.status(201).json(component.accept(this.stateSerializer));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  private parseCreateComponentInput(
    body: any,
  ): CreateComponentInput | { error: string } {
    const { name, type, roomId } = body ?? {};
    if (typeof name !== "string" || name.length === 0) {
      return { error: "name must be a non-empty string" };
    }
    if (typeof roomId !== "string" || roomId.length === 0) {
      return { error: "roomId must be a non-empty string" };
    }
    if (typeof type !== "string" || !this.isComponentType(type)) {
      return { error: "Unsupported component type" };
    }
    return { name, type, roomId };
  }

  private isComponentType(value: string): value is ComponentTypes {
    return (Object.values(ComponentTypes) as string[]).includes(value);
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
      res.json(components.map((c) => c.accept(this.stateSerializer)));
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async getComponent(req: Request, res: Response) {
    try {
      const component = await this.homeService.getComponent(
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
      const action = req.params.action as string;
      const param = this.parseActionParams(action, req.body);

      const user = (req as AuthenticatedRequest).user;

      const { component, roomName } = await this.homeService.executeAction(
        req.params.id as string,
        req.params.componentId as string,
        req.params.action as string,
        param,
        user?.username && user.role
          ? { username: user.username, role: user.role }
          : undefined,
      );

      // Generate an event for the notification system
      if (user?.username && user.role && this.notificationPort) {
        this.notificationPort
          .notifyComponentAction(req.params.id as string, {
            componentId: component.id,
            componentName: component.name,
            action: req.params.action as string,
            actor: {
              username: user.username,
              role: user.role,
            },
          })
          .catch((error) =>
            console.error("Notification delivery failed", error),
          );
      }

      res.json({ ...component.accept(this.stateSerializer), roomName });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async getComponentEvents(req: Request, res: Response) {
    try {
      const events = await this.homeService.getComponentEvents(
        req.params.id as string,
      );
      res.json({
        events: events.map((event) => ({
          ...event,
          createdAt: event.createdAt.toISOString(),
        })),
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async updateInternalTemperature(req: Request, res: Response) {
    try {
      const { temperature } = req.body;

      if (typeof temperature !== "number") {
        return res.status(400).json({ error: "Temperature must be a number" });
      }

      await this.homeService.updateInternalTemperature(
        req.params.id as string,
        { temperature },
      );
      res.status(200).json({ message: "Internal temperature updated" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  async getLocationName(req: Request, res: Response) {
    try {
      const locationName = await this.homeService.getLocationName(
        req.params.id as string,
      );
      res.json({ locationName });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async getHourlyTemperatures(req: Request, res: Response) {
    try {
      const temps = await this.homeService.getHourlyTemperatures(
        req.params.id as string,
      );
      res.json(temps);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }

  async setHourlyTemperatures(req: Request, res: Response) {
    try {
      const { temperatures } = req.body;
      if (!Array.isArray(temperatures)) {
        return res.status(400).json({ error: "Temperatures must be an array" });
      }
      await this.homeService.setHourlyTemperatures(
        req.params.id as string,
        temperatures,
      );
      res.status(200).json({ message: "Hourly temperatures updated" });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }

  private parseActionParams(
    action: string,
    body: any,
  ): number | string | undefined {
    if (action === "setTemperature") {
      const { temperature } = body;
      if (typeof temperature !== "number") {
        throw new Error("Temperature parameter must be a number");
      }
      return temperature;
    }
    if (action === "setMode") {
      const { mode } = body ?? {};
      if (
        mode !== "off" &&
        mode !== "low" &&
        mode !== "medium" &&
        mode !== "high"
      ) {
        throw new Error("Mode must be one of: off, low, medium, high");
      }
      return mode;
    }
    return undefined;
  }
}
