import { Notification } from "./Notification";

export interface NotificationDeliveryPort {
  send(notification: Notification): void;
}
