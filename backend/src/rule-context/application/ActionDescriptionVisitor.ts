import {
  ComponentActionVisitor,
  LightTurnOffAction,
  LightTurnOnAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../domain/Actions";

export class ActionDescriptionVisitor implements ComponentActionVisitor<string> {
  visitLightTurnOnAction(action: LightTurnOnAction): string {
    return `Turn on light ${action.getComponentId()}`;
  }
  visitLightTurnOffAction(action: LightTurnOffAction): string {
    return `Turn off light ${action.getComponentId()}`;
  }
  visitWindowOpenAction(action: WindowOpenAction): string {
    return `Open window ${action.getComponentId()}`;
  }
  visitWindowCloseAction(action: WindowCloseAction): string {
    return `Close window ${action.getComponentId()}`;
  }
  visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): string {
    return `Set thermostat ${action.getComponentId()} to ${action.targetTemperature}°C`;
  }
}
