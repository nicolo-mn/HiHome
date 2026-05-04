import { Notification } from "../domain/Notification";
import { NotificationRepository } from "../domain/NotificationRepository";

export class InMemoryNotificationRepository implements NotificationRepository {
  private store: Map<string, Notification[]> = new Map();

  async add(notification: Notification): Promise<void> {
    const list = this.store.get(notification.homeId) || [];
    list.push(notification);
    this.store.set(notification.homeId, list);
  }

  async listByHome(homeId: string): Promise<Notification[]> {
    return [...(this.store.get(homeId) || [])];
  }
}
