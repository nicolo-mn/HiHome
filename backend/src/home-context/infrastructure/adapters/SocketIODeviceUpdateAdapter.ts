import { Server } from "socket.io";
import { Device, Home } from "../../domain";
import { DeviceUpdatePort } from "../../domain/DeviceUpdatePort";
import { DeviceStateSerializer } from "../DeviceStateSerializer";

export class SocketIODeviceUpdateAdapter implements DeviceUpdatePort {
  private serializer = new DeviceStateSerializer();

  constructor(private io: Server) {}

  sendDeviceUpdate(home: Home, device: Device): void {
    const room = home.rooms.find((r) =>
      r.devices.some((c) => c.id === device.id),
    );
    this.io.to(`home-${home.id}`).emit("device:updated", {
      ...device.accept(this.serializer),
      roomName: room?.name,
    });
  }

  sendDeviceRemoved(home: Home, deviceId: string): void {
    this.io.to(`home-${home.id}`).emit("device:removed", { id: deviceId });
  }
}
