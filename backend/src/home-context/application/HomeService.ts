import {
  Component,
  Light,
  Coordinates,
  Window,
  Thermostat,
  Home,
  HomeRepository,
  ComponentTypes,
  TemperatureState,
  AirQualityState,
  WindState,
  WeatherState,
  SensorUpdatePort,
  ExternalSensorsUpdate,
  Room,
} from "../domain";
import { ActionService } from "./ActionService";
import { SensorRegistry } from "./SensorRegistry";
import { ExternalSensorsDataPort } from "./ExternalSensorsDataPort";
import { RuleServicePort } from "./RuleServicePort";

export class HomeService implements ActionService {
  constructor(
    private homeRepo: HomeRepository,
    private sensorRegistry: SensorRegistry,
    private sensorUpdatePort: SensorUpdatePort,
    private ruleServicePort: RuleServicePort,
    private externalSensorsDataPort: ExternalSensorsDataPort,
  ) {}

  async getComponents(homeId: string): Promise<Component[]> {
    const home = await this.ensureHomeExists(homeId);
    return home.getAllComponents();
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

  async addComponent(
    homeId: string,
    roomId: string,
    componentData: any,
  ): Promise<Component> {
    const home = await this.ensureHomeExists(homeId);
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
    param?: number,
  ): Promise<Component> {
    const home = await this.ensureHomeExists(homeId);

    const component = home.getComponentById(componentId);
    if (!component) throw new Error("Component not found");

    if (typeof (component as any)[action] === "function") {
      (component as any)[action](param);
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

  async getHomeCoordinates(homeId: string): Promise<Coordinates> {
    console.log(`Fetching coordinates for home ${homeId}`);
    const home = await this.ensureHomeExists(homeId);
    return home.coordinates;
  }

  async lightTurnOn(homeId: string, lightId: string): Promise<void> {
    const componentType = ComponentTypes.LIGHT;

    const home = await this.ensureHomeExists(homeId);

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

    const home = await this.ensureHomeExists(homeId);

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

    const home = await this.ensureHomeExists(homeId);

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

    const home = await this.ensureHomeExists(homeId);

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

    const home = await this.ensureHomeExists(homeId);
    const component = home.getComponentByIdAndType(thermostatId, componentType);
    if (!component)
      throw new Error(
        `Component ${thermostatId} of type ${componentType} not found`,
      );

    const thermostat = component as Thermostat;
    thermostat.setTemperature(temperature);

    await this.homeRepo.saveHome(home);
  }

  async sendExternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await this.ensureHomeExists(homeId);

    const resolvedUpdate =
      this.sensorRegistry.getState(homeId)?.externalSensors;
    if (!resolvedUpdate) return;

    const resolvedNotify = this.shouldNotifyAirQuality(home.id);

    await this.sendExternalSensorsUpdateToClients(
      home,
      resolvedUpdate,
      resolvedNotify,
    );
  }

  async sendInternalSensorsUpdate(homeId: string): Promise<void> {
    const home = await this.ensureHomeExists(homeId);

    const resolvedTemperature =
      this.sensorRegistry.getState(homeId)?.internalTemperature;
    if (resolvedTemperature === undefined) return;

    await this.sendInternalSensorsUpdateToClients(home, resolvedTemperature);
  }

  async pollAllHomesExternalSensorsData(): Promise<void> {
    const homes = await this.homeRepo.getAllHomes();

    await Promise.all(
      homes.map(async (home) => {
        try {
          const extSensorsData =
            await this.externalSensorsDataPort.getExternalSensorsData(home);

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

          await this.sendInternalSensorsUpdateToClients(
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
    await this.sendInternalSensorsUpdate(homeId);
  }

  private async sendExternalSensorsUpdateToClients(
    home: Home,
    update: ExternalSensorsUpdate,
    notify = true,
  ): Promise<void> {
    await this.sensorUpdatePort.sendExternalTemperatureUpdate(
      home,
      update.externalTemperature,
    );
    await this.sensorUpdatePort.sendAirQualityUpdate(
      home,
      update.airQuality,
      notify,
    );
    await this.sensorUpdatePort.sendWindUpdate(home, update.wind);
    await this.sensorUpdatePort.sendWeatherUpdate(home, update.weather);
  }

  private async sendInternalSensorsUpdateToClients(
    home: Home,
    update: TemperatureState,
  ): Promise<void> {
    await this.sensorUpdatePort.sendInternalTemperatureUpdate(home, update);
  }

  private async ensureHomeExists(homeId: string) {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error(`Home ${homeId} not found`);
    return home;
  }

  private shouldNotifyAirQuality(homeId: string): boolean {
    // TODO: read notification preferences once they are available.
    return true;
  }
}
