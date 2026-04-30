import { Server } from "socket.io";
import { SensorUpdatePort } from "../domain/SensorUpdatePort";
import { SensorUpdate } from "../domain/SensorUpdate";

export class SocketIOSensorUpdatePort implements SensorUpdatePort {
  constructor(
    private io: Server,
    private homeId: string,
  ) {}

  sendUpdate(update: SensorUpdate): void {
    this.io.to(`home-${this.homeId}`).emit("sensorUpdate", {
      sensorId: update.sensorId,
      type: update.sensorType,
      value: update.value,
      measureUnit: update.measureUnit,
    });
  }
}
