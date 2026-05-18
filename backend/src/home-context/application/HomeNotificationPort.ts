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

export interface SensorUpdateEvent {
  sensorType: string;
  value: string | number;
  measureUnit: string;
}

export interface HomeNotificationOutboundPort {
  notifyComponentAction(
    homeId: string,
    event: ComponentActionEvent,
  ): Promise<void>;
  notifySensorUpdate(homeId: string, event: SensorUpdateEvent): Promise<void>;
}
