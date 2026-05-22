import { randomUUID } from "crypto";
import {
  ComponentActionEvent,
  NotificationDTO,
  NotificationInboundPort,
  RuleExecutionEvent,
  SensorUpdateEvent,
} from "./NotificationInboundPort";
import { Notification } from "../domain/Notification";
import { NotificationDeliveryPort } from "../domain/NotificationDeliveryPort";
import { NotificationRepository } from "../domain/NotificationRepository";
import { NotificationPolicy } from "./NotificationPolicy";
import { UserPreferencesPort } from "./UserPreferencesPort";

export class NotificationService implements NotificationInboundPort {
  constructor(
    private repository: NotificationRepository,
    private deliveryPort: NotificationDeliveryPort,
    private policy: NotificationPolicy,
    private userPreferencesPort: UserPreferencesPort,
  ) {}

  async listByHome(homeId: string): Promise<NotificationDTO[]> {
    const notifications = await this.repository.listByHome(homeId);
    return notifications.map((n) => this.toDTO(n));
  }

  async listByHomeFiltered(
    homeId: string,
    allowedTypes: string[],
  ): Promise<NotificationDTO[]> {
    const notifications = await this.repository.listByHome(homeId);
    return notifications
      .filter((n) => allowedTypes.includes(n.type))
      .map((n) => this.toDTO(n));
  }

  private toDTO(n: Notification): NotificationDTO {
    return {
      id: n.id,
      homeId: n.homeId,
      type: n.type,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
      read: n.read,
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

    const shouldNotify = await this.shouldNotifyAirQuality(homeId, airQuality);
    if (!shouldNotify) return;

    const notification = new Notification(
      randomUUID(),
      homeId,
      "AirQualityThresholdBreach",
      `Air quality exceeded the threshold (${threshold}).`,
    );

    await this.repository.add(notification);
    const recipients =
      await this.userPreferencesPort.getEnabledUsernamesForType(
        homeId,
        "AirQualityThresholdBreach",
      );
    this.deliveryPort.send(notification, recipients);
  }

  async notifyRuleExecuted(
    homeId: string,
    event: RuleExecutionEvent,
  ): Promise<void> {
    const notification = new Notification(
      randomUUID(),
      homeId,
      "AutomationRuleExecuted",
      `Automation rule executed: ${event.ruleName}.`,
    );

    await this.repository.add(notification);
    const recipients =
      await this.userPreferencesPort.getEnabledUsernamesForType(
        homeId,
        "AutomationRuleExecuted",
      );
    this.deliveryPort.send(notification, recipients);
  }

  async notifyComponentAction(
    homeId: string,
    event: ComponentActionEvent,
  ): Promise<void> {
    if (event.actor.role === "Admin") return;
    const componentLabel = event.componentName || event.componentId;
    const notification = new Notification(
      randomUUID(),
      homeId,
      "ComponentAction",
      `${event.actor.username} performed ${event.action} on ${componentLabel}.`,
    );

    await this.repository.add(notification);
    const recipients =
      await this.userPreferencesPort.getEnabledUsernamesForType(
        homeId,
        "ComponentAction",
      );
    this.deliveryPort.send(notification, recipients);
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

  private async shouldNotifyAirQuality(
    homeId: string,
    airQuality: number,
  ): Promise<boolean> {
    // Check when the last air quality notification was sent to avoid spamming
    const recentNotifications = await this.repository.listByHome(homeId);
    const lastAirQualityNotification = recentNotifications
      .filter((n) => n.type === "AirQualityThresholdBreach")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (
      lastAirQualityNotification &&
      Date.now() - lastAirQualityNotification.createdAt.getTime() <
        60 * 60 * 1000 // 1 hour
    ) {
      return false;
    }
    return true;
  }
}
