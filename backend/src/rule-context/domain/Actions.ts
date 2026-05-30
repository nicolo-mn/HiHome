export type FanMode = "off" | "low" | "medium" | "high";

export interface DeviceActionVisitor<T> {
  visitLightTurnOnAction(action: LightTurnOnAction): T;
  visitLightTurnOffAction(action: LightTurnOffAction): T;
  visitWindowOpenAction(action: WindowOpenAction): T;
  visitWindowCloseAction(action: WindowCloseAction): T;
  visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): T;
  visitLockLockAction(action: LockLockAction): T;
  visitLockUnlockAction(action: LockUnlockAction): T;
  visitFanSetModeAction(action: FanSetModeAction): T;
}

export interface DeviceAction {
  getHomeId(): string;
  getDeviceId(): string;
  accept<T>(visitor: DeviceActionVisitor<T>): T;
}

export class LightTurnOnAction implements DeviceAction {
  constructor(
    private homeId: string,
    private deviceId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitLightTurnOnAction(this);
  }
}

export class LightTurnOffAction implements DeviceAction {
  constructor(
    private homeId: string,
    private deviceId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitLightTurnOffAction(this);
  }
}

export class WindowOpenAction implements DeviceAction {
  constructor(
    private homeId: string,
    private deviceId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitWindowOpenAction(this);
  }
}

export class WindowCloseAction implements DeviceAction {
  constructor(
    private homeId: string,
    private deviceId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitWindowCloseAction(this);
  }
}

export class ThermostatSetTemperatureAction implements DeviceAction {
  constructor(
    private homeId: string,
    public deviceId: string,
    public targetTemperature: number,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitThermostatSetTemperatureAction(this);
  }
}

export class LockLockAction implements DeviceAction {
  constructor(
    private homeId: string,
    private deviceId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitLockLockAction(this);
  }
}

export class LockUnlockAction implements DeviceAction {
  constructor(
    private homeId: string,
    private deviceId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitLockUnlockAction(this);
  }
}

export class FanSetModeAction implements DeviceAction {
  constructor(
    private homeId: string,
    public deviceId: string,
    public mode: FanMode,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  accept<T>(visitor: DeviceActionVisitor<T>): T {
    return visitor.visitFanSetModeAction(this);
  }
}
