import { Notification } from "./Notification";

export interface NotificationRepository {
  add(notification: Notification): Promise<void>;
  listByUser(homeId: string, username: string): Promise<Notification[]>;
  findLatestByHomeAndType(
    homeId: string,
    type: string,
  ): Promise<Notification | null>;
}
