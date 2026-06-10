export type NotificationType =
  | "AirQualityThresholdBreach"
  | "AutomationRuleExecuted"
  | "DeviceAction";

export const ALL_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "AirQualityThresholdBreach",
  "AutomationRuleExecuted",
  "DeviceAction",
];

export interface RuleExecutionDetails {
  executions: { ruleName: string; actions: string[] }[];
}

export type NotificationDetails = RuleExecutionDetails;

export class Notification {
  constructor(
    public id: string,
    public homeId: string,
    public type: NotificationType,
    public message: string,
    public username: string,
    public createdAt: Date = new Date(),
    public read: boolean = false,
    public details?: NotificationDetails,
  ) {}

  markRead(): void {
    this.read = true;
  }
}
