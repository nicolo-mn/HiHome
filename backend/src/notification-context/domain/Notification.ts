export type NotificationType =
  | "AirQualityThresholdBreach"
  | "AutomationRuleExecuted"
  | "ComponentAction";

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
