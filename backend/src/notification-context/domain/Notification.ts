export type NotificationType =
  | "AirQualityThresholdBreach"
  | "AutomationRuleExecuted"
  | "ComponentAction";

export class Notification {
  constructor(
    public id: string,
    public homeId: string,
    public type: NotificationType,
    public message: string,
    public createdAt: Date = new Date(),
    public read: boolean = false,
  ) {}

  markRead(): void {
    this.read = true;
  }
}
