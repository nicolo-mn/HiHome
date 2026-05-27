export type FanMode = "off" | "low" | "medium" | "high";

export interface ComponentActionVisitor<T> {
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

export interface ComponentAction {
  getHomeId(): string;
  getComponentId(): string;
  accept<T>(visitor: ComponentActionVisitor<T>): T;
}

export class LightTurnOnAction implements ComponentAction {
  constructor(
    private homeId: string,
    private componentId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitLightTurnOnAction(this);
  }
}

export class LightTurnOffAction implements ComponentAction {
  constructor(
    private homeId: string,
    private componentId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitLightTurnOffAction(this);
  }
}

export class WindowOpenAction implements ComponentAction {
  constructor(
    private homeId: string,
    private componentId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitWindowOpenAction(this);
  }
}

export class WindowCloseAction implements ComponentAction {
  constructor(
    private homeId: string,
    private componentId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitWindowCloseAction(this);
  }
}

export class ThermostatSetTemperatureAction implements ComponentAction {
  constructor(
    private homeId: string,
    public componentId: string,
    public targetTemperature: number,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitThermostatSetTemperatureAction(this);
  }
}

export class LockLockAction implements ComponentAction {
  constructor(
    private homeId: string,
    private componentId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitLockLockAction(this);
  }
}

export class LockUnlockAction implements ComponentAction {
  constructor(
    private homeId: string,
    private componentId: string,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitLockUnlockAction(this);
  }
}

export class FanSetModeAction implements ComponentAction {
  constructor(
    private homeId: string,
    public componentId: string,
    public mode: FanMode,
  ) {}

  getHomeId(): string {
    return this.homeId;
  }

  getComponentId(): string {
    return this.componentId;
  }

  accept<T>(visitor: ComponentActionVisitor<T>): T {
    return visitor.visitFanSetModeAction(this);
  }
}
