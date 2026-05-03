import { Server } from "socket.io";
import { Notification } from "../domain/Notification";
import { NotificationDeliveryPort } from "../domain/NotificationDeliveryPort";

export class SocketIONotificationPort implements NotificationDeliveryPort {
  constructor(private io: Server) {}

  send(notification: Notification): void {
    this.io.to(`home-${notification.homeId}`).emit("notification", {
      id: notification.id,
      homeId: notification.homeId,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read,
    });
  }
}
