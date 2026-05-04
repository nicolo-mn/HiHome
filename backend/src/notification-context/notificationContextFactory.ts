import { Server } from "socket.io";
import { NotificationInboundPort } from "./application/NotificationInboundPort";
import { DefaultNotificationPolicy } from "./application/NotificationPolicy";
import { NotificationService } from "./application/NotificationService";
import { InMemoryNotificationRepository } from "./infrastructure/InMemoryNotificationRepository";
import { SocketIONotificationPort } from "./infrastructure/SocketIONotificationPort";

export interface NotificationContext {
  notificationPort: NotificationInboundPort;
}

export class NotificationContextFactory {
  static create(io: Server): NotificationContext {
    const repository = new InMemoryNotificationRepository();
    const deliveryPort = new SocketIONotificationPort(io);
    const policy = new DefaultNotificationPolicy();
    const service = new NotificationService(repository, deliveryPort, policy);

    return { notificationPort: service };
  }
}
