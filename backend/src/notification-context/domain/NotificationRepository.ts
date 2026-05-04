import { Notification } from "./Notification";

export interface NotificationRepository {
  add(notification: Notification): Promise<void>;
  listByHome(homeId: string): Promise<Notification[]>;
}
