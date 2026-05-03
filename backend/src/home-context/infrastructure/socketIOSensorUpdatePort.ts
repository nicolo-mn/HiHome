import { Server } from "socket.io";
import { SensorUpdatePort } from "../domain/SensorUpdatePort";
import { SensorUpdate } from "../domain/SensorUpdate";
import { NotificationInboundPort } from "../../notification-context/application/NotificationInboundPort";

export class SocketIOSensorUpdatePort implements SensorUpdatePort {
  constructor(
    private io: Server,
    private homeId: string,
    private notificationPort?: NotificationInboundPort,
  ) {}

  sendUpdate(update: SensorUpdate): void {
    this.io.to(`home-${this.homeId}`).emit("sensorUpdate", {
      sensorId: update.sensorId,
      type: update.sensorType,
      value: update.value,
      measureUnit: update.measureUnit,
    });

    // Generate an event for the notification systems about the sensors,
    // explicitly ignores the return value
    void this.notificationPort?.notifySensorUpdate(this.homeId, {
      sensorId: update.sensorId,
      sensorType: update.sensorType,
      value: update.value,
      measureUnit: update.measureUnit,
    });
  }
}
