import { Notification } from "../domain/Notification";
import { NotificationRepository } from "../domain/NotificationRepository";

export class InMemoryNotificationRepository implements NotificationRepository {
  private store: Notification[] = [];

  async add(notification: Notification): Promise<void> {
    this.store.push(notification);
  }

  async listByUser(homeId: string, username: string): Promise<Notification[]> {
    return this.store
      .filter((n) => n.homeId === homeId && n.username === username)
      .slice()
      .reverse();
  }

  async findLatestByHomeAndType(
    homeId: string,
    type: string,
  ): Promise<Notification | null> {
    const matches = this.store
      .filter((n) => n.homeId === homeId && n.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return matches[0] ?? null;
  }
}
