import { Server } from "socket.io";
import { NotificationInboundPort } from "./application/ports/NotificationInboundPort";
import { DefaultNotificationPolicy } from "./application/NotificationPolicy";
import { NotificationService } from "./application/services/NotificationService";
import { PreferencesService } from "./application/services/PreferencesService";
import { HomeUsersPort } from "./application/ports/HomeUsersPort";
import { InMemoryNotificationRepository } from "./infrastructure/repositories/InMemoryNotificationRepository";
import { MongoNotificationRepository } from "./infrastructure/repositories/MongoNotificationRepository";
import { InMemoryPreferencesRepository } from "./infrastructure/repositories/InMemoryPreferencesRepository";
import { MongoPreferencesRepository } from "./infrastructure/repositories/MongoPreferencesRepository";
import { SocketIONotificationPort } from "./infrastructure/adapters/SocketIONotificationAdapter";

export interface NotificationContext {
  notificationPort: NotificationInboundPort;
  preferencesService: PreferencesService;
}

export class NotificationContextFactory {
  static create(io: Server, homeUsersPort: HomeUsersPort): NotificationContext {
    const isTest = process.env.NODE_ENV === "test";
    const repository = isTest
      ? new InMemoryNotificationRepository()
      : new MongoNotificationRepository();
    const preferencesRepository = isTest
      ? new InMemoryPreferencesRepository()
      : new MongoPreferencesRepository();
    const deliveryPort = new SocketIONotificationPort(io);
    const policy = new DefaultNotificationPolicy();
    const preferencesService = new PreferencesService(
      preferencesRepository,
      homeUsersPort,
    );
    const service = new NotificationService(
      repository,
      deliveryPort,
      policy,
      preferencesService,
    );

    return { notificationPort: service, preferencesService };
  }
}
