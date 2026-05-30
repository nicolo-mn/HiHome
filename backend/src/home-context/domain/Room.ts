import { Device } from "./Device";

export class Room {
  constructor(
    public id: string,
    public name: string,
    public devices: Device[] = [],
  ) {}
}
