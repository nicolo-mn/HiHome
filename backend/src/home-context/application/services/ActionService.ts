export interface ActionService {
  lightTurnOn(homeId: string, lightId: string): Promise<void>;
  lightTurnOff(homeId: string, lightId: string): Promise<void>;
  windowOpen(homeId: string, windowId: string): Promise<void>;
  windowClose(homeId: string, windowId: string): Promise<void>;
  thermostatSetTemperature(
    homeId: string,
    thermostatId: string,
    temperature: number,
  ): Promise<void>;
  lockLock(homeId: string, lockId: string): Promise<void>;
  lockUnlock(homeId: string, lockId: string): Promise<void>;
}
