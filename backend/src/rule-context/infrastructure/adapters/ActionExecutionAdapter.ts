import { ActionExecutionPort } from "../../domain/ActionExecutionPort";
import {
  FanSetModeAction,
  LightTurnOffAction,
  LightTurnOnAction,
  LockLockAction,
  LockUnlockAction,
  ThermostatSetTemperatureAction,
  WindowCloseAction,
  WindowOpenAction,
} from "../../domain/Actions";
import { ActionService } from "../../../home-context/application/services/ActionService";

export class ActionExecutionAdapter implements ActionExecutionPort {
  constructor(private actionService: ActionService) {}

  async executeLightTurnOn(action: LightTurnOnAction): Promise<void> {
    console.log(
      `Rule action: LightTurnOn home=${action.getHomeId()} device=${action.getDeviceId()}`,
    );
    await this.actionService.lightTurnOn(
      action.getHomeId(),
      action.getDeviceId(),
    );
  }

  async executeLightTurnOff(action: LightTurnOffAction): Promise<void> {
    console.log(
      `Rule action: LightTurnOff home=${action.getHomeId()} device=${action.getDeviceId()}`,
    );
    await this.actionService.lightTurnOff(
      action.getHomeId(),
      action.getDeviceId(),
    );
  }

  async executeWindowOpen(action: WindowOpenAction): Promise<void> {
    console.log(
      `Rule action: WindowOpen home=${action.getHomeId()} device=${action.getDeviceId()}`,
    );
    await this.actionService.windowOpen(
      action.getHomeId(),
      action.getDeviceId(),
    );
  }

  async executeWindowClose(action: WindowCloseAction): Promise<void> {
    console.log(
      `Rule action: WindowClose home=${action.getHomeId()} device=${action.getDeviceId()}`,
    );
    await this.actionService.windowClose(
      action.getHomeId(),
      action.getDeviceId(),
    );
  }

  async executeThermostatSetTemperature(
    action: ThermostatSetTemperatureAction,
  ): Promise<void> {
    console.log(
      `Rule action: ThermostatSetTemperature home=${action.getHomeId()} device=${action.getDeviceId()} target=${action.targetTemperature}`,
    );
    await this.actionService.thermostatSetTemperature(
      action.getHomeId(),
      action.getDeviceId(),
      action.targetTemperature,
    );
  }

  async executeLockLock(action: LockLockAction): Promise<void> {
    console.log(
      `Rule action: LockLock home=${action.getHomeId()} device=${action.getDeviceId()}`,
    );
    await this.actionService.lockLock(action.getHomeId(), action.getDeviceId());
  }

  async executeLockUnlock(action: LockUnlockAction): Promise<void> {
    console.log(
      `Rule action: LockUnlock home=${action.getHomeId()} device=${action.getDeviceId()}`,
    );
    await this.actionService.lockUnlock(
      action.getHomeId(),
      action.getDeviceId(),
    );
  }

  async executeFanSetMode(action: FanSetModeAction): Promise<void> {
    console.log(
      `Rule action: FanSetMode home=${action.getHomeId()} device=${action.getDeviceId()} mode=${action.mode}`,
    );
    await this.actionService.fanSetMode(
      action.getHomeId(),
      action.getDeviceId(),
      action.mode,
    );
  }
}
