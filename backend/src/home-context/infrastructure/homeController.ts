import { Request, Response } from "express";
import { HomeService } from "../application/homeService";
import { ComponentStateSerializer } from "./componentStateSerializer";

export class HomeController {
  private stateSerializer = new ComponentStateSerializer();

  constructor(private homeService: HomeService) {}

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
