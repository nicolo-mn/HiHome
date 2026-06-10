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

export type ActionRecord = {
  type: string;
  homeId: string;
  deviceId: string;
  targetTemperature?: number;
  mode?: FanMode;
};

export class ActionRecordVisitor implements DeviceActionVisitor<ActionRecord> {
  visitLightTurnOnAction(action: LightTurnOnAction): ActionRecord {
    return {
      type: "light-turn-on",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
    };
  }

  visitLightTurnOffAction(action: LightTurnOffAction): ActionRecord {
    return {
      type: "light-turn-off",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
    };
  }

  visitWindowOpenAction(action: WindowOpenAction): ActionRecord {
    return {
      type: "window-open",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
    };
  }

  visitWindowCloseAction(action: WindowCloseAction): ActionRecord {
    return {
      type: "window-close",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
    };
  }

  visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): ActionRecord {
    return {
      type: "thermostat-set-temperature",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
      targetTemperature: action.targetTemperature,
    };
  }

  visitLockLockAction(action: LockLockAction): ActionRecord {
    return {
      type: "lock-lock",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
    };
  }

  visitLockUnlockAction(action: LockUnlockAction): ActionRecord {
    return {
      type: "lock-unlock",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
    };
  }

  visitFanSetModeAction(action: FanSetModeAction): ActionRecord {
    return {
      type: "fan-set-mode",
      homeId: action.getHomeId(),
      deviceId: action.getDeviceId(),
      mode: action.mode,
    };
  }
}
