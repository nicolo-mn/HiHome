import { ActionExecutionPort } from "../domain/ActionExecutionPort";
import {
  LightTurnOffAction,
  LightTurnOnAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../domain/Actions";
import { ActionService } from "../../home-context/application/ActionService";

export class ActionExecutionAdapter implements ActionExecutionPort {
  constructor(private actionService: ActionService) {}

  async executeLightTurnOn(action: LightTurnOnAction): Promise<void> {
    console.log(
      `Rule action: LightTurnOn home=${action.getHomeId()} component=${action.getComponentId()}`,
    );
    await this.actionService.lightTurnOn(
      action.getHomeId(),
      action.getComponentId(),
    );
  }

  async executeLightTurnOff(action: LightTurnOffAction): Promise<void> {
    console.log(
      `Rule action: LightTurnOff home=${action.getHomeId()} component=${action.getComponentId()}`,
    );
    await this.actionService.lightTurnOff(
      action.getHomeId(),
      action.getComponentId(),
    );
  }

  async executeWindowOpen(action: WindowOpenAction): Promise<void> {
    console.log(
      `Rule action: WindowOpen home=${action.getHomeId()} component=${action.getComponentId()}`,
    );
    await this.actionService.windowOpen(
      action.getHomeId(),
      action.getComponentId(),
    );
  }

  async executeWindowClose(action: WindowCloseAction): Promise<void> {
    console.log(
      `Rule action: WindowClose home=${action.getHomeId()} component=${action.getComponentId()}`,
    );
    await this.actionService.windowClose(
      action.getHomeId(),
      action.getComponentId(),
    );
  }

  async executeThermostatSetTemperature(
    action: ThermostatSetTemperatureAction,
  ): Promise<void> {
    console.log(
      `Rule action: ThermostatSetTemperature home=${action.getHomeId()} component=${action.getComponentId()} target=${action.targetTemperature}`,
    );
    await this.actionService.thermostatSetTemperature(
      action.getHomeId(),
      action.getComponentId(),
      action.targetTemperature,
    );
  }
}
