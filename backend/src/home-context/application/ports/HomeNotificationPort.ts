export interface NotificationActor {
  username: string;
  role: string;
}

export interface DeviceActionEvent {
  deviceId: string;
  deviceName?: string;
  action: string;
  actor: NotificationActor;
}

export interface SensorUpdateEvent {
  sensorType: string;
  value: string | number;
  measureUnit: string;
}

export interface HomeNotificationOutboundPort {
  notifyDeviceAction(homeId: string, event: DeviceActionEvent): Promise<void>;
  notifySensorUpdate(homeId: string, event: SensorUpdateEvent): Promise<void>;
}
