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
import { ActionExecutionPort } from "../domain/ActionExecutionPort";

export class DeviceActionExecutionVisitor implements DeviceActionVisitor<
  Promise<void>
> {
  constructor(private actionPort: ActionExecutionPort) {}

  async visitLightTurnOnAction(action: LightTurnOnAction): Promise<void> {
    await this.actionPort.executeLightTurnOn(action);
  }

  async visitLightTurnOffAction(action: LightTurnOffAction): Promise<void> {
    await this.actionPort.executeLightTurnOff(action);
  }

  async visitWindowOpenAction(action: WindowOpenAction): Promise<void> {
    await this.actionPort.executeWindowOpen(action);
  }

  async visitWindowCloseAction(action: WindowCloseAction): Promise<void> {
    await this.actionPort.executeWindowClose(action);
  }

  async visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): Promise<void> {
    await this.actionPort.executeThermostatSetTemperature(action);
  }

  async visitLockLockAction(action: LockLockAction): Promise<void> {
    await this.actionPort.executeLockLock(action);
  }

  async visitLockUnlockAction(action: LockUnlockAction): Promise<void> {
    await this.actionPort.executeLockUnlock(action);
  }

  async visitFanSetModeAction(action: FanSetModeAction): Promise<void> {
    await this.actionPort.executeFanSetMode(action);
  }
}
