import { Server } from "socket.io";
import { NotificationInboundPort } from "./application/ports/NotificationInboundPort";
import { DefaultNotificationPolicy } from "./application/NotificationPolicy";
import { NotificationService } from "./application/services/NotificationService";
import { UserPreferencesPort } from "./application/ports/UserPreferencesPort";
import { InMemoryNotificationRepository } from "./infrastructure/repositories/InMemoryNotificationRepository";
import { MongoNotificationRepository } from "./infrastructure/repositories/MongoNotificationRepository";
import { SocketIONotificationPort } from "./infrastructure/adapters/SocketIONotificationAdapter";

export interface NotificationContext {
  notificationPort: NotificationInboundPort;
}

export class NotificationContextFactory {
  static create(
    io: Server,
    userPreferencesPort: UserPreferencesPort,
  ): NotificationContext {
    const repository =
      process.env.NODE_ENV === "test"
        ? new InMemoryNotificationRepository()
        : new MongoNotificationRepository();
    const deliveryPort = new SocketIONotificationPort(io);
    const policy = new DefaultNotificationPolicy();
    const service = new NotificationService(
      repository,
      deliveryPort,
      policy,
      userPreferencesPort,
    );

    return { notificationPort: service };
  }
}
