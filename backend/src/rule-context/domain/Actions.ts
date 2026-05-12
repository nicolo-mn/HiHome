export interface ComponentActionVisitor<T> {
  visitLightTurnOnAction(action: LightTurnOnAction): T;
  visitLightTurnOffAction(action: LightTurnOffAction): T;
  visitWindowOpenAction(action: WindowOpenAction): T;
  visitWindowCloseAction(action: WindowCloseAction): T;
  visitThermostatSetTemperatureAction(
    action: ThermostatSetTemperatureAction,
  ): T;
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
