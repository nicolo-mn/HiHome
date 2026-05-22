export interface SensorUpdateEvent {
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

export interface RulesExecutedEvent {
  executions: { ruleName: string; actions: string[] }[];
}

export interface NotificationDTO {
  id: string;
  homeId: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  details?: { executions: { ruleName: string; actions: string[] }[] };
}

export interface NotificationInboundPort {
  notifySensorUpdate(homeId: string, update: SensorUpdateEvent): Promise<void>;
  notifyRulesExecuted(homeId: string, event: RulesExecutedEvent): Promise<void>;
  notifyComponentAction(
    homeId: string,
    event: ComponentActionEvent,
  ): Promise<void>;
  listByUser(homeId: string, username: string): Promise<NotificationDTO[]>;
}
