import { Component } from "./Component";

export class Room {
  constructor(
    public id: string,
    public name: string,
    public components: Component[] = [],
  ) {}
}
