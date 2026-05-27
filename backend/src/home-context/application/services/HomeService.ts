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
  SmartLock,
} from "../../domain";
import { SensorRegistry } from "../SensorRegistry";
import { ExternalSensorsDataPort } from "../ports/ExternalSensorsDataPort";
import { RuleServicePort } from "../ports/RuleServicePort";
import { CreateComponentInput } from "../dtos/ComponentDTO";
import { ensureHomeExists, persistAndBroadcast } from "./ServiceHelpers";

export class HomeService {
  constructor(
    private homeRepo: HomeRepository,
    private sensorRegistry: SensorRegistry,
    private sensorUpdatePort: SensorUpdatePort,
    private ruleServicePort: RuleServicePort,
    private externalSensorsDataPort: ExternalSensorsDataPort,
    private componentUpdatePort?: ComponentUpdatePort,
  ) {}

  async getComponents(homeId: string): Promise<Component[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.getAllComponents();
  }

  async getComponentsWithRoomNames(
    homeId: string,
  ): Promise<{ component: Component; roomName: string }[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.rooms.flatMap((room) =>
      room.components.map((component) => ({ component, roomName: room.name })),
    );
  }

  async getRooms(homeId: string): Promise<Room[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.rooms;
  }

  async getComponent(componentId: string): Promise<Component | undefined> {
    const component = await this.homeRepo.getComponentById(componentId);
    if (!component) throw new Error("Component not found");
    return component;
  }

  async getComponentEvents(homeId: string): Promise<ComponentEvent[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return [...home.eventLog].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async addComponent(
    homeId: string,
    input: CreateComponentInput,
  ): Promise<Component> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
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
  ): Promise<{ component: Component; roomName: string }> {
    const home = await ensureHomeExists(this.homeRepo, homeId);

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
    await persistAndBroadcast(
      this.homeRepo,
      home,
      component,
      this.componentUpdatePort,
    );
    const event = (component as any)[action](param) as ComponentEvent;
    if (event) {
      home.addComponentEvent({ ...event, actor });
    }

    await this.homeRepo.saveHome(home);
    const room = home.rooms.find((r) => r.id === component.roomId);
    return { component, roomName: room?.name ?? "" };
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
      if (type === ComponentTypes.LOCK) return c instanceof SmartLock;
      return false;
    });
  }

  async getHomeCoordinates(homeId: string): Promise<Coordinates> {
    console.log(`Fetching coordinates for home ${homeId}`);
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.coordinates;
  }

  async getHourlyTemperatures(homeId: string): Promise<number[]> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
    return home.hourlyTemperatures;
  }

  async setHourlyTemperatures(
    homeId: string,
    temperatures: number[],
  ): Promise<void> {
    const home = await ensureHomeExists(this.homeRepo, homeId);
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

  async sendExternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await ensureHomeExists(this.homeRepo, homeId);

    const resolvedUpdate =
      this.sensorRegistry.getState(homeId)?.externalSensors;
    if (!resolvedUpdate) return;

    this.sendExternalSensorsUpdateToClients(home, resolvedUpdate);
  }

  async sendInternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await ensureHomeExists(this.homeRepo, homeId);

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
}
