import { randomUUID } from "crypto";
import {
  ComponentActionEvent,
  NotificationDTO,
  NotificationInboundPort,
  RulesExecutedEvent,
  SensorUpdateEvent,
} from "./ports/NotificationInboundPort";
import { Notification, NotificationDetails } from "../domain/Notification";
import { NotificationDeliveryPort } from "../domain/NotificationDeliveryPort";
import { NotificationRepository } from "../domain/NotificationRepository";
import { NotificationPolicy } from "./NotificationPolicy";
import { UserPreferencesPort } from "./ports/UserPreferencesPort";

export class NotificationService implements NotificationInboundPort {
  constructor(
    private repository: NotificationRepository,
    private deliveryPort: NotificationDeliveryPort,
    private policy: NotificationPolicy,
    private userPreferencesPort: UserPreferencesPort,
  ) {}

  async listByUser(
    homeId: string,
    username: string,
  ): Promise<NotificationDTO[]> {
    const notifications = await this.repository.listByUser(homeId, username);
    return notifications.map((n) => this.toDTO(n));
  }

  private toDTO(n: Notification): NotificationDTO {
    return {
      id: n.id,
      homeId: n.homeId,
      type: n.type,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
      read: n.read,
      details: n.details,
    };
  }

  async notifySensorUpdate(
    homeId: string,
    update: SensorUpdateEvent,
  ): Promise<void> {
    const airQuality = this.extractAirQualityValue(update);
    if (airQuality === null) return;

    const threshold = this.policy.getAirQualityThreshold(homeId);
    if (airQuality <= threshold) return;

    const shouldNotify = await this.shouldNotifyAirQuality(homeId);
    if (!shouldNotify) return;

    await this.storeAndDeliver(
      homeId,
      "AirQualityThresholdBreach",
      `Air quality exceeded the threshold (${threshold}).`,
    );
  }

  async notifyRulesExecuted(
    homeId: string,
    event: RulesExecutedEvent,
  ): Promise<void> {
    if (event.executions.length === 0) return;
    await this.storeAndDeliver(
      homeId,
      "AutomationRuleExecuted",
      "Rules executed",
      { executions: event.executions },
    );
  }

  async notifyComponentAction(
    homeId: string,
    event: ComponentActionEvent,
  ): Promise<void> {
    if (event.actor.role === "Admin") return;
    const componentLabel = event.componentName || event.componentId;
    await this.storeAndDeliver(
      homeId,
      "ComponentAction",
      `${event.actor.username} performed ${event.action} on ${componentLabel}.`,
    );
  }

  private async storeAndDeliver(
    homeId: string,
    type: Notification["type"],
    message: string,
    details?: NotificationDetails,
  ): Promise<void> {
    const recipients =
      await this.userPreferencesPort.getEnabledUsernamesForType(homeId, type);
    for (const username of recipients) {
      const notification = new Notification(
        randomUUID(),
        homeId,
        type,
        message,
        username,
        new Date(),
        false,
        details,
      );
      await this.repository.add(notification);
      this.deliveryPort.send(notification, [username]);
    }
  }

  private extractAirQualityValue(update: SensorUpdateEvent): number | null {
    if (!this.policy.isAirQualitySensor(update.sensorType)) return null;

    if (typeof update.value === "number") return update.value;

    if (this.isRecord(update.value)) {
      const value = update.value as Record<string, unknown>;
      const aqi = value.aqi ?? value.airQuality;
      if (typeof aqi === "number") return aqi;
    }

    return null;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private async shouldNotifyAirQuality(homeId: string): Promise<boolean> {
    const last = await this.repository.findLatestByHomeAndType(
      homeId,
      "AirQualityThresholdBreach",
    );
    if (last && Date.now() - last.createdAt.getTime() < 60 * 60 * 1000) {
      return false;
    }
    return true;
  }
}
