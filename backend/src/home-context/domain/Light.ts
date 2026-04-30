import { Component } from "./Component";
import { ComponentVisitor } from "./ComponentVisitor";

export class Light implements Component {
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public state: { isOn: boolean } = { isOn: false },
  ) {}

  accept<T>(visitor: ComponentVisitor<T>): T {
    return visitor.visitLight(this);
  }

  turnOn() {
    this.state.isOn = true;
  }

  turnOff() {
    this.state.isOn = false;
  }
}
