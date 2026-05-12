import { ComponentVisitor } from "./ComponentVisitor";

export enum ComponentTypes {
  LIGHT = "light",
  WINDOW = "window",
  THERMOSTAT = "thermostat",
}

export interface Component {
  id: string;
  name: string;
  roomId?: string;
  getType(): ComponentTypes;
  accept<T>(visitor: ComponentVisitor<T>): T;
}

export class Light implements Component {
  private type: ComponentTypes = ComponentTypes.LIGHT;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isOn: boolean = false,
  ) {}

  getType(): ComponentTypes {
    return this.type;
  }

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitLight(this);
  }

  turnOn() {
    this.isOn = true;
  }

  turnOff() {
    this.isOn = false;
  }
}

export class Window implements Component {
  private type: ComponentTypes = ComponentTypes.WINDOW;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isOpen: boolean = false,
  ) {}

  getType(): ComponentTypes {
    return this.type;
  }

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitWindow(this);
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }
}

export class Thermostat implements Component {
  private type: ComponentTypes = ComponentTypes.THERMOSTAT;
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public temperature: number = 20,
  ) {}

  getType(): ComponentTypes {
    return this.type;
  }

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitThermostat(this);
  }

  setTemperature(temp: number) {
    this.temperature = temp;
  }
}
