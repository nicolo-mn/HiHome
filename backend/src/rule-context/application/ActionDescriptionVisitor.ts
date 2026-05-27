import {
  ComponentActionVisitor,
  FanSetModeAction,
  LightTurnOffAction,
  LightTurnOnAction,
  LockLockAction,
  LockUnlockAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../domain/Actions";

export class ActionDescriptionVisitor implements ComponentActionVisitor<string> {
  constructor(private componentNameById: Map<string, string>) {}

  private name(componentId: string): string {
    return this.componentNameById.get(componentId) ?? componentId;
  }

  visitLightTurnOnAction(action: LightTurnOnAction): string {
    return `Turn on light ${this.name(action.getComponentId())}`;
  }
  visitLightTurnOffAction(action: LightTurnOffAction): string {
    return `Turn off light ${this.name(action.getComponentId())}`;
  }
  visitWindowOpenAction(action: WindowOpenAction): string {
    return `Open window ${this.name(action.getComponentId())}`;
  }
  visitWindowCloseAction(action: WindowCloseAction): string {
    return `Close window ${this.name(action.getComponentId())}`;
  }
  visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): string {
    return `Set thermostat ${this.name(action.getComponentId())} to ${action.targetTemperature}°C`;
  }
  visitLockLockAction(action: LockLockAction): string {
    return `Lock ${this.name(action.getComponentId())}`;
  }
  visitLockUnlockAction(action: LockUnlockAction): string {
    return `Unlock ${this.name(action.getComponentId())}`;
  }
  visitFanSetModeAction(action: FanSetModeAction): string {
    return `Set fan ${this.name(action.getComponentId())} to ${action.mode}`;
  }
}
