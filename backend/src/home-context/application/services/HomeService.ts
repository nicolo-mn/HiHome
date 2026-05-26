import { randomUUID } from "crypto";
import {
  Component,
  Light,
  Coordinates,
  Window,
  Thermostat,
  Home,
  HomeRepository,
  ComponentTypes,
  ComponentEvent,
  ComponentEventActor,
  TemperatureState,
  SensorUpdatePort,
  ExternalSensorsUpdate,
  Room,
  createComponent,
  ComponentUpdatePort,
} from "../../domain";
import { ActionService } from "./ActionService";
import { SensorRegistry } from "../SensorRegistry";
import { ExternalSensorsDataPort } from "../ports/ExternalSensorsDataPort";
import { RuleServicePort } from "../ports/RuleServicePort";
import { CreateComponentInput } from "../dtos/ComponentDTO";

export class HomeService implements ActionService {
  constructor(
    private homeRepo: HomeRepository,
    private sensorRegistry: SensorRegistry,
    private sensorUpdatePort: SensorUpdatePort,
    private ruleServicePort: RuleServicePort,
    private externalSensorsDataPort: ExternalSensorsDataPort,
    private componentUpdatePort?: ComponentUpdatePort,
  ) {}

  async getComponents(homeId: string): Promise<Component[]> {
    const home = await this.ensureHomeExists(homeId);
    return home.getAllComponents();
  }

  async getComponentsWithRoomNames(
    homeId: string,
  ): Promise<{ component: Component; roomName: string }[]> {
    const home = await this.ensureHomeExists(homeId);
    return home.rooms.flatMap((room) =>
      room.components.map((component) => ({ component, roomName: room.name })),
    );
  }

  async getRooms(homeId: string): Promise<Room[]> {
    const home = await this.ensureHomeExists(homeId);
    return home.rooms;
  }

  async getComponent(componentId: string): Promise<Component | undefined> {
    const component = await this.homeRepo.getComponentById(componentId);
    if (!component) throw new Error("Component not found");
    return component;
  }

  async getComponentEvents(homeId: string): Promise<ComponentEvent[]> {
    const home = await this.ensureHomeExists(homeId);
    return [...home.eventLog].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async addComponent(
    homeId: string,
    input: CreateComponentInput,
  ): Promise<Component> {
    const home = await this.ensureHomeExists(homeId);
    const room = home.rooms.find((r) => r.id === input.roomId);
    if (!room) throw new Error("Room not found");

    const component = createComponent(randomUUID(), input);
    room.components.push(component);
    await this.homeRepo.saveHome(home);
    return component;
  }

  async executeAction(
    homeId: string,
    componentId: string,
    action: string,
    param?: number,
    actor?: ComponentEventActor,
  ): Promise<Component> {
    const home = await this.ensureHomeExists(homeId);

    const component = home.getComponentById(componentId);
    if (!component) {
      console.error(
        `Failed to execute action ${action}: Component ${componentId} not found in home ${homeId}`,
      );
      throw new Error("Component not found");
    }

    if (typeof (component as any)[action] !== "function") {
      console.error(
        `Failed to execute action ${action}: Action not supported on component ${componentId}`,
      );
      throw new Error("Action not supported");
    }

    console.log(
      `Executing component action ${action} for home ${homeId} on component ${componentId}`,
    );
    await this.persistAndBroadcast(home, component);
    const event = (component as any)[action](param) as ComponentEvent;
    if (event) {
      home.addComponentEvent({ ...event, actor });
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

  async getHomeCoordinates(homeId: string): Promise<Coordinates> {
    console.log(`Fetching coordinates for home ${homeId}`);
    const home = await this.ensureHomeExists(homeId);
    return home.coordinates;
  }

  async getHourlyTemperatures(homeId: string): Promise<number[]> {
    const home = await this.ensureHomeExists(homeId);
    return home.hourlyTemperatures;
  }

  async setHourlyTemperatures(
    homeId: string,
    temperatures: number[],
  ): Promise<void> {
    const home = await this.ensureHomeExists(homeId);
    if (temperatures.length !== 24) {
      throw new Error("Hourly temperatures must have exactly 24 values");
    }
    home.hourlyTemperatures = temperatures;
    await this.homeRepo.saveHome(home);
  }

  async applyHourlyTemperaturePlan(date = new Date()): Promise<void> {
    const hour = date.getHours();
    const homes = await this.homeRepo.getAllHomes();

    await Promise.all(
      homes.map(async (home) => {
        const plan = Array.isArray(home.hourlyTemperatures)
          ? home.hourlyTemperatures
          : [];
        if (plan.length !== 24) {
          console.warn(
            `Hourly temperature plan invalid for home ${home.id}, skipping update`,
          );
          return;
        }

        const temperature = plan[hour];
        if (typeof temperature !== "number") {
          console.warn(
            `Hourly temperature missing for home ${home.id} at hour ${hour}, skipping update`,
          );
          return;
        }

        await this.updateInternalTemperature(home.id, { temperature });
      }),
    );
  }

  async lightTurnOn(homeId: string, lightId: string): Promise<void> {
    const componentType = ComponentTypes.LIGHT;

    const home = await this.ensureHomeExists(homeId);

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

    await this.persistAndBroadcast(home, light);
  }

  async lightTurnOff(homeId: string, lightId: string): Promise<void> {
    const componentType = ComponentTypes.LIGHT;

    const home = await this.ensureHomeExists(homeId);

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

    await this.persistAndBroadcast(home, light);
  }

  async windowOpen(homeId: string, windowId: string): Promise<void> {
    const componentType = ComponentTypes.WINDOW;

    const home = await this.ensureHomeExists(homeId);

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

    await this.persistAndBroadcast(home, window);
  }

  async windowClose(homeId: string, windowId: string): Promise<void> {
    const componentType = ComponentTypes.WINDOW;

    const home = await this.ensureHomeExists(homeId);

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

    await this.persistAndBroadcast(home, window);
  }

  async thermostatSetTemperature(
    homeId: string,
    thermostatId: string,
    temperature: number,
  ): Promise<void> {
    const componentType = ComponentTypes.THERMOSTAT;

    const home = await this.ensureHomeExists(homeId);
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

    await this.persistAndBroadcast(home, thermostat);
  }

  async sendExternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await this.ensureHomeExists(homeId);

    const resolvedUpdate =
      this.sensorRegistry.getState(homeId)?.externalSensors;
    if (!resolvedUpdate) return;

    this.sendExternalSensorsUpdateToClients(home, resolvedUpdate);
  }

  async sendInternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await this.ensureHomeExists(homeId);

    const resolvedTemperature =
      this.sensorRegistry.getState(homeId)?.internalTemperature;
    if (resolvedTemperature === undefined) return;

    this.sendInternalSensorsUpdateToClients(home, resolvedTemperature);
  }

  async pollAllHomesExternalSensorsData(): Promise<void> {
    const homes = await this.homeRepo.getAllHomes();

    await Promise.all(
      homes.map(async (home) => {
        try {
          const extSensorsData =
            await this.externalSensorsDataPort.getExternalSensorsData(home);

          console.log(
            `External sensors update received for home ${home.id}: temp=${extSensorsData.externalTemperature.temperature} AQI=${extSensorsData.airQuality.AQI}`,
          );

          this.sensorRegistry.setExternalSensorsUpdate(home.id, extSensorsData);

          await this.sendExternalSensorsUpdate(home.id);

          const internalTemperatureValue = this.sensorRegistry.getState(
            home.id,
          )?.internalTemperature;
          if (internalTemperatureValue === undefined) {
            console.warn(
              `No internal temperature found for home ${home.id}, skipping rules evaluation`,
            );
            return;
          }

          const internalTemperature: TemperatureState =
            internalTemperatureValue;

          this.sendInternalSensorsUpdateToClients(
            home,
            internalTemperatureValue,
          );

          this.ruleServicePort.evaluateRules(
            home.id,
            extSensorsData,
            internalTemperature,
          );
        } catch (error) {
          console.error(
            `Failed to poll external sensors data for home ${home.id}:`,
            error,
          );
        }
      }),
    );
  }

  async updateInternalTemperature(
    homeId: string,
    update: TemperatureState,
  ): Promise<void> {
    this.sensorRegistry.setInternalTemperature(homeId, update);
    console.log(
      `Internal temperature update received for home ${homeId}: temp=${update.temperature}`,
    );
    await this.sendInternalSensorsUpdate(homeId);
  }

  private sendExternalSensorsUpdateToClients(
    home: Home,
    update: ExternalSensorsUpdate,
  ): void {
    this.sensorUpdatePort.sendExternalTemperatureUpdate(
      home,
      update.externalTemperature,
    );
    this.sensorUpdatePort.sendAirQualityUpdate(home, update.airQuality);
    this.sensorUpdatePort.sendWindUpdate(home, update.wind);
    this.sensorUpdatePort.sendWeatherUpdate(home, update.weather);
  }

  private sendInternalSensorsUpdateToClients(
    home: Home,
    update: TemperatureState,
  ): void {
    this.sensorUpdatePort.sendInternalTemperatureUpdate(home, update);
  }

  private async persistAndBroadcast(
    home: Home,
    component: Component,
  ): Promise<void> {
    await this.homeRepo.saveHome(home);
    this.componentUpdatePort?.sendComponentUpdate(home, component);
  }

  private async ensureHomeExists(homeId: string) {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error(`Home ${homeId} not found`);
    return home;
  }
}
