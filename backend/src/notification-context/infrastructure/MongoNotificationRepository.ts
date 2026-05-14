import { Notification, NotificationType } from "../domain/Notification";
import { NotificationRepository } from "../domain/NotificationRepository";
import { NotificationModel } from "./models/NotificationModel";

type NotificationRecord = {
  id: string;
  homeId: string;
  type: NotificationType;
  message: string;
  createdAt: Date;
  read: boolean;
};

export class MongoNotificationRepository implements NotificationRepository {
  async add(notification: Notification): Promise<void> {
    const record: NotificationRecord = {
      id: notification.id,
      homeId: notification.homeId,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt,
      read: notification.read,
    };

    await NotificationModel.create(record);
  }

  async listByHome(homeId: string): Promise<Notification[]> {
    const docs = await NotificationModel.find({ homeId })
      .sort({ createdAt: -1 })
      .lean<NotificationRecord[]>()
      .exec();

    return docs.map(
      (doc) =>
        new Notification(
          doc.id,
          doc.homeId,
          doc.type,
          doc.message,
          doc.createdAt instanceof Date
            ? doc.createdAt
            : new Date(doc.createdAt),
          doc.read,
        ),
    );
  }
}
