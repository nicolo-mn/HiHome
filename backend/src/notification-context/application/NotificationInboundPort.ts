export interface SensorUpdateEvent {
  sensorId: string;
  sensorType: string;
  value: string | number;
  measureUnit: string;
}

export interface NotificationActor {
  username: string;
  role: string;
}

export interface ComponentActionEvent {
  componentId: string;
  componentName?: string;
  action: string;
  actor: NotificationActor;
}

export interface RuleExecutionEvent {
  ruleName: string;
  triggeredBy?: string;
}

export interface NotificationInboundPort {
  notifySensorUpdate(homeId: string, update: SensorUpdateEvent): Promise<void>;
  notifyRuleExecuted(homeId: string, event: RuleExecutionEvent): Promise<void>;
  notifyComponentAction(
    homeId: string,
    event: ComponentActionEvent,
  ): Promise<void>;
}
