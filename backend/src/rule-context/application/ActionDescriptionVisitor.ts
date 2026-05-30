import {
  DeviceActionVisitor,
  FanSetModeAction,
  LightTurnOffAction,
  LightTurnOnAction,
  LockLockAction,
  LockUnlockAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../domain/Actions";

export class ActionDescriptionVisitor implements DeviceActionVisitor<string> {
  constructor(private deviceNameById: Map<string, string>) {}

  private name(deviceId: string): string {
    return this.deviceNameById.get(deviceId) ?? deviceId;
  }

  visitLightTurnOnAction(action: LightTurnOnAction): string {
    return `Turn on light ${this.name(action.getDeviceId())}`;
  }
  visitLightTurnOffAction(action: LightTurnOffAction): string {
    return `Turn off light ${this.name(action.getDeviceId())}`;
  }
  visitWindowOpenAction(action: WindowOpenAction): string {
    return `Open window ${this.name(action.getDeviceId())}`;
  }
  visitWindowCloseAction(action: WindowCloseAction): string {
    return `Close window ${this.name(action.getDeviceId())}`;
  }
  visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): string {
    return `Set thermostat ${this.name(action.getDeviceId())} to ${action.targetTemperature}°C`;
  }
  visitLockLockAction(action: LockLockAction): string {
    return `Lock ${this.name(action.getDeviceId())}`;
  }
  visitLockUnlockAction(action: LockUnlockAction): string {
    return `Unlock ${this.name(action.getDeviceId())}`;
  }
  visitFanSetModeAction(action: FanSetModeAction): string {
    return `Set fan ${this.name(action.getDeviceId())} to ${action.mode}`;
  }
}
