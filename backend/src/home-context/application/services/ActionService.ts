import {
  ComponentEventActor,
  ComponentTypes,
  ComponentUpdatePort,
  HomeRepository,
  Light,
  SmartLock,
  Thermostat,
  Window,
} from "../../domain";
import { ensureHomeExists, persistAndBroadcast } from "./ServiceHelpers";

export class ActionService {
  constructor(
    private homeRepo: HomeRepository,
    private componentUpdatePort?: ComponentUpdatePort,
  ) {}

  async lightTurnOn(homeId: string, lightId: string): Promise<void> {
    const componentType = ComponentTypes.LIGHT;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const component = home.getComponentByIdAndType(lightId, componentType);
    if (!component) {
      console.error(
        `Failed to execute lightTurnOn: Component ${lightId} of type ${componentType} not found in home ${homeId}`,
      );
      throw new Error(
        `Component ${lightId} of type ${componentType} not found`,
      );
    }
    console.log(`Executing lightTurnOn for home ${homeId} on light ${lightId}`);
    const light = component as Light;
    const event = light.turnOn();
    home.addComponentEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      light,
      this.componentUpdatePort,
    );
  }

  async lightTurnOff(homeId: string, lightId: string): Promise<void> {
    const componentType = ComponentTypes.LIGHT;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const component = home.getComponentByIdAndType(lightId, componentType);
    if (!component) {
      console.error(
        `Failed to execute lightTurnOff: Component ${lightId} of type ${componentType} not found in home ${homeId}`,
      );
      throw new Error(
        `Component ${lightId} of type ${componentType} not found`,
      );
    }
    console.log(
      `Executing lightTurnOff for home ${homeId} on light ${lightId}`,
    );
    const light = component as Light;
    const event = light.turnOff();
    home.addComponentEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      light,
      this.componentUpdatePort,
    );
  }

  async windowOpen(homeId: string, windowId: string): Promise<void> {
    const componentType = ComponentTypes.WINDOW;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const component = home.getComponentByIdAndType(windowId, componentType);
    if (!component) {
      console.error(
        `Failed to execute windowOpen: Component ${windowId} of type ${componentType} not found in home ${homeId}`,
      );
      throw new Error(
        `Component ${windowId} of type ${componentType} not found`,
      );
    }
    console.log(
      `Executing windowOpen for home ${homeId} on window ${windowId}`,
    );
    const window = component as Window;
    const event = window.open();
    home.addComponentEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      window,
      this.componentUpdatePort,
    );
  }

  async windowClose(homeId: string, windowId: string): Promise<void> {
    const componentType = ComponentTypes.WINDOW;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const component = home.getComponentByIdAndType(windowId, componentType);
    if (!component) {
      console.error(
        `Failed to execute windowClose: Component ${windowId} of type ${componentType} not found in home ${homeId}`,
      );
      throw new Error(
        `Component ${windowId} of type ${componentType} not found`,
      );
    }
    console.log(
      `Executing windowClose for home ${homeId} on window ${windowId}`,
    );
    const window = component as Window;
    const event = window.close();
    home.addComponentEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      window,
      this.componentUpdatePort,
    );
  }

  async thermostatSetTemperature(
    homeId: string,
    thermostatId: string,
    temperature: number,
  ): Promise<void> {
    const componentType = ComponentTypes.THERMOSTAT;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const component = home.getComponentByIdAndType(thermostatId, componentType);
    if (!component) {
      console.error(
        `Failed to execute thermostatSetTemperature: Component ${thermostatId} of type ${componentType} not found in home ${homeId}`,
      );
      throw new Error(
        `Component ${thermostatId} of type ${componentType} not found`,
      );
    }
    console.log(
      `Executing thermostatSetTemperature for home ${homeId} on thermostat ${thermostatId} to ${temperature}`,
    );
    const thermostat = component as Thermostat;
    const event = thermostat.setTemperature(temperature);
    home.addComponentEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      thermostat,
      this.componentUpdatePort,
    );
  }

  async lockLock(homeId: string, lockId: string): Promise<void> {
    const componentType = ComponentTypes.LOCK;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const component = home.getComponentByIdAndType(lockId, componentType);
    if (!component) {
      console.error(
        `Failed to execute lockLock: Component ${lockId} of type ${componentType} not found in home ${homeId}`,
      );
      throw new Error(`Component ${lockId} of type ${componentType} not found`);
    }
    console.log(`Executing lockLock for home ${homeId} on lock ${lockId}`);
    const lock = component as SmartLock;
    const event = lock.lock();
    home.addComponentEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      lock,
      this.componentUpdatePort,
    );
  }

  async lockUnlock(
    homeId: string,
    lockId: string,
    actor?: ComponentEventActor,
  ): Promise<void> {
    const componentType = ComponentTypes.LOCK;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const component = home.getComponentByIdAndType(lockId, componentType);
    if (!component) {
      console.error(
        `Failed to execute lockUnlock: Component ${lockId} of type ${componentType} not found in home ${homeId}`,
      );
      throw new Error(`Component ${lockId} of type ${componentType} not found`);
    }
    console.log(`Executing lockUnlock for home ${homeId} on lock ${lockId}`);
    const lock = component as SmartLock;
    const event = lock.unlock(actor);
    home.addComponentEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      lock,
      this.componentUpdatePort,
    );
  }
}
