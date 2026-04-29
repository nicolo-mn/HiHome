import { Component } from "./Component";

export class Light implements Component {
  constructor(
    public id: string,
    public name: string,
    public roomId: string,
    public state: { isOn: boolean } = { isOn: false },
  ) {}

  turnOn() {
    this.state.isOn = true;
  }

  turnOff() {
    this.state.isOn = false;
  }
}
