import { Component } from "./Component";
import { ComponentVisitor } from "./ComponentVisitor";

export class Light implements Component {
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public isOn: boolean = false,
  ) {}

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
