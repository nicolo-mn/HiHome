import { Server } from "socket.io";
import { Notification } from "../domain/Notification";
import { NotificationDeliveryPort } from "../domain/NotificationDeliveryPort";

export class SocketIONotificationPort implements NotificationDeliveryPort {
  constructor(private io: Server) {}

  send(notification: Notification, recipientUsernames?: string[]): void {
    const payload = {
      id: notification.id,
      homeId: notification.homeId,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read,
      details: notification.details,
    };
    if (recipientUsernames) {
      for (const username of recipientUsernames) {
        this.io.to(`user-${username}`).emit("notification", payload);
      }
    } else {
      this.io.to(`home-${notification.homeId}`).emit("notification", payload);
    }
  }
}
