import { randomUUID } from "crypto";
import {
  ComponentActionEvent,
  NotificationInboundPort,
  RuleExecutionEvent,
  SensorUpdateEvent,
} from "./NotificationInboundPort";
import { Notification } from "../domain/Notification";
import { NotificationDeliveryPort } from "../domain/NotificationDeliveryPort";
import { NotificationRepository } from "../domain/NotificationRepository";
import { NotificationPolicy } from "./NotificationPolicy";

export class NotificationService implements NotificationInboundPort {
  constructor(
    private repository: NotificationRepository,
    private deliveryPort: NotificationDeliveryPort,
    private policy: NotificationPolicy,
  ) {}

  async notifySensorUpdate(
    homeId: string,
    update: SensorUpdateEvent,
  ): Promise<void> {
    const airQuality = this.extractAirQualityValue(update);
    if (airQuality === null) return;

    const threshold = this.policy.getAirQualityThreshold(homeId);
    if (airQuality >= threshold) return;

    const notification = new Notification(
      randomUUID(),
      homeId,
      "AirQualityThresholdBreach",
      `Air quality dropped below the threshold (${threshold}).`,
    );

    await this.repository.add(notification);
    this.deliveryPort.send(notification);
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
    this.deliveryPort.send(notification);
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
    this.deliveryPort.send(notification);
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
}
