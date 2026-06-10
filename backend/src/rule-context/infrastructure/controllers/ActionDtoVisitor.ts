import {
  FanMode,
  DeviceActionVisitor,
  FanSetModeAction,
  LightTurnOnAction,
  LightTurnOffAction,
  LockLockAction,
  LockUnlockAction,
  WindowOpenAction,
  WindowCloseAction,
  ThermostatSetTemperatureAction,
} from "../../domain/Actions";

export type ActionDto = {
  type: string;
  deviceId: string;
  targetTemperature?: number;
  mode?: FanMode;
};

export class ActionDtoVisitor implements DeviceActionVisitor<ActionDto> {
  visitLightTurnOnAction(action: LightTurnOnAction): ActionDto {
    return { type: "light-turn-on", deviceId: action.getDeviceId() };
  }

  visitLightTurnOffAction(action: LightTurnOffAction): ActionDto {
    return { type: "light-turn-off", deviceId: action.getDeviceId() };
  }

  visitWindowOpenAction(action: WindowOpenAction): ActionDto {
    return { type: "window-open", deviceId: action.getDeviceId() };
  }

  visitWindowCloseAction(action: WindowCloseAction): ActionDto {
    return { type: "window-close", deviceId: action.getDeviceId() };
  }

  visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): ActionDto {
    return {
      type: "thermostat-set-temperature",
      deviceId: action.getDeviceId(),
      targetTemperature: action.targetTemperature,
    };
  }

  visitLockLockAction(action: LockLockAction): ActionDto {
    return { type: "lock-lock", deviceId: action.getDeviceId() };
  }

  visitLockUnlockAction(action: LockUnlockAction): ActionDto {
    return { type: "lock-unlock", deviceId: action.getDeviceId() };
  }

  visitFanSetModeAction(action: FanSetModeAction): ActionDto {
    return {
      type: "fan-set-mode",
      deviceId: action.getDeviceId(),
      mode: action.mode,
    };
  }
}
