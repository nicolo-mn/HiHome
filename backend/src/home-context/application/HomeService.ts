import {
  Component,
  Sensor,
  Light,
  Coordinates,
  Window,
  Thermostat,
  HomeRepository,
  ComponentTypes,
} from "../domain";
import { ActionService } from "./ActionService";

export class HomeService implements ActionService {
  constructor(private homeRepo: HomeRepository) {}

  async getComponents(homeId: string): Promise<Component[]> {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");
    return home.getAllComponents();
  }

  async getComponent(componentId: string): Promise<Component | undefined> {
    const component = await this.homeRepo.getComponentById(componentId);
    if (!component) throw new Error("Component not found");
    return component;
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
    if (componentData.type === ComponentTypes.LIGHT) {
      component = new Light(componentData.id, componentData.name, roomId);
    } else if (componentData.type === ComponentTypes.WINDOW) {
      component = new Window(componentData.id, componentData.name, roomId);
    } else if (componentData.type === ComponentTypes.THERMOSTAT) {
      component = new Thermostat(componentData.id, componentData.name, roomId);
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
    return Object.values(ComponentTypes); // The component types come from an enum
  }

  async getComponentsByType(
    homeId: string,
    type: string,
  ): Promise<Component[]> {
    const components = await this.getComponents(homeId);
    return components.filter((c) => {
      if (type === ComponentTypes.LIGHT) return c instanceof Light;
      if (type === ComponentTypes.WINDOW) return c instanceof Window;
      if (type === ComponentTypes.THERMOSTAT) return c instanceof Thermostat;
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

  async getHomeCoordinates(homeId: string): Promise<Coordinates> {
    console.log(`Fetching coordinates for home ${homeId}`);
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");
    return home.coordinates;
  }

  async lightTurnOn(homeId: string, lightId: string): Promise<void> {
    const componentType = ComponentTypes.LIGHT;

    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");

    const component = home.getComponentByIdAndType(lightId, componentType);
    if (!component)
      throw new Error(
        `Component ${lightId} of type ${componentType} not found`,
      );

    const light = component as Light;
    light.turnOn();

    await this.homeRepo.saveHome(home);
  }

  async lightTurnOff(homeId: string, lightId: string): Promise<void> {
    const componentType = ComponentTypes.LIGHT;

    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");

    const component = home.getComponentByIdAndType(lightId, componentType);
    if (!component)
      throw new Error(
        `Component ${lightId} of type ${componentType} not found`,
      );

    const light = component as Light;
    light.turnOff();

    await this.homeRepo.saveHome(home);
  }

  async windowOpen(homeId: string, windowId: string): Promise<void> {
    const componentType = ComponentTypes.WINDOW;

    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");

    const component = home.getComponentByIdAndType(windowId, componentType);
    if (!component)
      throw new Error(
        `Component ${windowId} of type ${componentType} not found`,
      );

    const window = component as Window;
    window.open();

    await this.homeRepo.saveHome(home);
  }

  async windowClose(homeId: string, windowId: string): Promise<void> {
    const componentType = ComponentTypes.WINDOW;

    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");

    const component = home.getComponentByIdAndType(windowId, componentType);
    if (!component)
      throw new Error(
        `Component ${windowId} of type ${componentType} not found`,
      );

    const window = component as Window;
    window.close();

    await this.homeRepo.saveHome(home);
  }

  async thermostatSetTemperature(
    homeId: string,
    thermostatId: string,
    temperature: number,
  ): Promise<void> {
    const componentType = ComponentTypes.THERMOSTAT;

    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error("Home not found");

    const component = home.getComponentByIdAndType(thermostatId, componentType);
    if (!component)
      throw new Error(
        `Component ${thermostatId} of type ${componentType} not found`,
      );

    const thermostat = component as Thermostat;
    thermostat.setTemperature(temperature);

    await this.homeRepo.saveHome(home);
  }
}
