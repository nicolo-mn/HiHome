import { Server } from "socket.io";
import { NotificationInboundPort } from "./application/NotificationInboundPort";
import { DefaultNotificationPolicy } from "./application/NotificationPolicy";
import { NotificationService } from "./application/NotificationService";
import { InMemoryNotificationRepository } from "./infrastructure/InMemoryNotificationRepository";
import { MongoNotificationRepository } from "./infrastructure/MongoNotificationRepository";
import { SocketIONotificationPort } from "./infrastructure/SocketIONotificationPort";

export interface NotificationContext {
  notificationPort: NotificationInboundPort;
}

export class NotificationContextFactory {
  static create(io: Server): NotificationContext {
    const repository =
      process.env.NODE_ENV === "test"
        ? new InMemoryNotificationRepository()
        : new MongoNotificationRepository();
    const deliveryPort = new SocketIONotificationPort(io);
    const policy = new DefaultNotificationPolicy();
    const service = new NotificationService(repository, deliveryPort, policy);

    return { notificationPort: service };
  }
}
