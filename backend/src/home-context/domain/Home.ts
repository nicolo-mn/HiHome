import { Coordinates } from "./Coordinates";
import { Room } from "./Room";
import { Device, DeviceTypes } from "./Device";
import { DeviceEvent } from "./EventLog";

export class Home {
  constructor(
    public id: string,
    public coordinates: Coordinates,
    public rooms: Room[] = [],
    public hourlyTemperatures: number[] = new Array(24).fill(20),
    public eventLog: DeviceEvent[] = [],
  ) {}

  getAllDevices(): Device[] {
    return this.rooms.flatMap((room) => room.devices);
  }

  getDeviceById(deviceId: string): Device | undefined {
    return this.getAllDevices().find((c) => c.id === deviceId);
  }

  getDeviceByIdAndType(
    deviceId: string,
    type: DeviceTypes,
  ): Device | undefined {
    return this.getAllDevices().find(
      (c) => c.id === deviceId && c.getType() === type,
    );
  }

  addDeviceEvent(event: DeviceEvent) {
    this.eventLog.push(event);
  }
}
