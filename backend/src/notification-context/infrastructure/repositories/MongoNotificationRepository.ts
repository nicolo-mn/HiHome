import {
  Notification,
  NotificationDetails,
  NotificationType,
} from "../../domain/Notification";
import { NotificationRepository } from "../../domain/NotificationRepository";
import { NotificationModel } from "../models/NotificationModel";

type NotificationRecord = {
  id: string;
  homeId: string;
  username: string;
  type: NotificationType;
  message: string;
  createdAt: Date;
  read: boolean;
  details?: NotificationDetails;
};

export class MongoNotificationRepository implements NotificationRepository {
  async add(notification: Notification): Promise<void> {
    const record: NotificationRecord = {
      id: notification.id,
      homeId: notification.homeId,
      username: notification.username,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,
      read: notification.read,
      details: notification.details,
    };

    await NotificationModel.create(record);
  }

  async listByUser(homeId: string, username: string): Promise<Notification[]> {
    const docs = await NotificationModel.find({ homeId, username })
      .sort({ createdAt: -1 })
      .lean<NotificationRecord[]>()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findLatestByHomeAndType(
    homeId: string,
    type: string,
  ): Promise<Notification | null> {
    const doc = await NotificationModel.findOne({ homeId, type })
      .sort({ createdAt: -1 })
      .lean<NotificationRecord>()
      .exec();

    return doc ? this.toDomain(doc) : null;
  }

  private toDomain(doc: NotificationRecord): Notification {
    return new Notification(
      doc.id,
      doc.homeId,
      doc.type,
      doc.message,
      doc.username,
      doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt),
      doc.read,
      doc.details,
    );
  }
}
