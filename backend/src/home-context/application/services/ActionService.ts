import {
  DeviceEventActor,
  DeviceTypes,
  DeviceUpdatePort,
  Fan,
  FanMode,
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
    private deviceUpdatePort?: DeviceUpdatePort,
  ) {}

  async lightTurnOn(homeId: string, lightId: string): Promise<void> {
    const deviceType = DeviceTypes.LIGHT;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(lightId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute lightTurnOn: Device ${lightId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${lightId} of type ${deviceType} not found`);
    }
    console.log(`Executing lightTurnOn for home ${homeId} on light ${lightId}`);
    const light = device as Light;
    const event = light.turnOn();
    home.addDeviceEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      light,
      this.deviceUpdatePort,
    );
  }

  async lightTurnOff(homeId: string, lightId: string): Promise<void> {
    const deviceType = DeviceTypes.LIGHT;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(lightId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute lightTurnOff: Device ${lightId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${lightId} of type ${deviceType} not found`);
    }
    console.log(
      `Executing lightTurnOff for home ${homeId} on light ${lightId}`,
    );
    const light = device as Light;
    const event = light.turnOff();
    home.addDeviceEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      light,
      this.deviceUpdatePort,
    );
  }

  async windowOpen(homeId: string, windowId: string): Promise<void> {
    const deviceType = DeviceTypes.WINDOW;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(windowId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute windowOpen: Device ${windowId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${windowId} of type ${deviceType} not found`);
    }
    console.log(
      `Executing windowOpen for home ${homeId} on window ${windowId}`,
    );
    const window = device as Window;
    const event = window.open();
    home.addDeviceEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      window,
      this.deviceUpdatePort,
    );
  }

  async windowClose(homeId: string, windowId: string): Promise<void> {
    const deviceType = DeviceTypes.WINDOW;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(windowId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute windowClose: Device ${windowId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${windowId} of type ${deviceType} not found`);
    }
    console.log(
      `Executing windowClose for home ${homeId} on window ${windowId}`,
    );
    const window = device as Window;
    const event = window.close();
    home.addDeviceEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      window,
      this.deviceUpdatePort,
    );
  }

  async thermostatSetTemperature(
    homeId: string,
    thermostatId: string,
    temperature: number,
  ): Promise<void> {
    const deviceType = DeviceTypes.THERMOSTAT;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(thermostatId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute thermostatSetTemperature: Device ${thermostatId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${thermostatId} of type ${deviceType} not found`);
    }
    console.log(
      `Executing thermostatSetTemperature for home ${homeId} on thermostat ${thermostatId} to ${temperature}`,
    );
    const thermostat = device as Thermostat;
    const event = thermostat.setTemperature(temperature);
    home.addDeviceEvent(event);
    await persistAndBroadcast(
      this.homeRepo,
      home,
      thermostat,
      this.deviceUpdatePort,
    );
  }

  async lockLock(homeId: string, lockId: string): Promise<void> {
    const deviceType = DeviceTypes.LOCK;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(lockId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute lockLock: Device ${lockId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${lockId} of type ${deviceType} not found`);
    }
    console.log(`Executing lockLock for home ${homeId} on lock ${lockId}`);
    const lock = device as SmartLock;
    const event = lock.lock();
    home.addDeviceEvent(event);
    await persistAndBroadcast(this.homeRepo, home, lock, this.deviceUpdatePort);
  }

  async lockUnlock(
    homeId: string,
    lockId: string,
    actor?: DeviceEventActor,
  ): Promise<void> {
    const deviceType = DeviceTypes.LOCK;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(lockId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute lockUnlock: Device ${lockId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${lockId} of type ${deviceType} not found`);
    }
    console.log(`Executing lockUnlock for home ${homeId} on lock ${lockId}`);
    const lock = device as SmartLock;
    const event = lock.unlock(actor);
    home.addDeviceEvent(event);
    await persistAndBroadcast(this.homeRepo, home, lock, this.deviceUpdatePort);
  }

  async fanSetMode(
    homeId: string,
    fanId: string,
    mode: FanMode,
  ): Promise<void> {
    const deviceType = DeviceTypes.FAN;
    const home = await ensureHomeExists(this.homeRepo, homeId);
    const device = home.getDeviceByIdAndType(fanId, deviceType);
    if (!device) {
      console.error(
        `Failed to execute fanSetMode: Device ${fanId} of type ${deviceType} not found in home ${homeId}`,
      );
      throw new Error(`Device ${fanId} of type ${deviceType} not found`);
    }
    console.log(
      `Executing fanSetMode for home ${homeId} on fan ${fanId} to ${mode}`,
    );
    const fan = device as Fan;
    const event = fan.setMode(mode);
    home.addDeviceEvent(event);
    await persistAndBroadcast(this.homeRepo, home, fan, this.deviceUpdatePort);
  }
}
