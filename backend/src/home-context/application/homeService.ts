import { HomeRepository } from "../domain/homeRepository";
import { Component, Sensor, Light } from "../domain";

export class HomeService {
  constructor(private homeRepo: HomeRepository) {}

  async getComponents(homeId: string): Promise<Component[]> {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");
    return home.getAllComponents();
  }

  async getComponent(
    homeId: string,
    componentId: string,
  ): Promise<Component | undefined> {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");
    return home.getComponentById(componentId);
  }

  async addComponent(
    homeId: string,
    roomId: string,
    componentData: any,
  ): Promise<Component> {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");
    const room = home.rooms.find((r) => r.id === roomId);
    if (!room) throw new Error("Room not found");

    let component: Component;
    if (componentData.type === "light") {
      component = new Light(componentData.id, componentData.name, roomId);
    } else {
      throw new Error("Unsupported component type");
    }

    room.components.push(component);
    await this.homeRepo.saveHome(home);
    return component;
  }

  async executeAction(
    homeId: string,
    componentId: string,
    action: string,
  ): Promise<Component> {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");

    const component = home.getComponentById(componentId);
    if (!component) throw new Error("Component not found");

    if (typeof (component as any)[action] === "function") {
      (component as any)[action]();
    } else {
      throw new Error("Action not supported");
    }

    await this.homeRepo.saveHome(home);
    return component;
  }

  async getComponentTypes(): Promise<string[]> {
    return ["light"]; // Could also derive from codebase dynamically, hardcoded for now
  }

  async getComponentsByType(
    homeId: string,
    type: string,
  ): Promise<Component[]> {
    const components = await this.getComponents(homeId);
    return components.filter((c) => {
      if (type === "light") return c instanceof Light;
      return false;
    });
  }

  async getSensorTypes(): Promise<string[]> {
    return ["thermometer"];
  }

  async getSensors(homeId: string): Promise<Sensor[]> {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");
    return home.getAllSensors();
  }
}
