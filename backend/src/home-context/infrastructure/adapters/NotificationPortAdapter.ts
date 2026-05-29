import {
  DeviceActionEvent,
  HomeNotificationOutboundPort,
  SensorUpdateEvent,
} from "../../application/ports/HomeNotificationPort";
import { NotificationInboundPort } from "../../../notification-context/application/ports/NotificationInboundPort";

export class NotificationContextAdapter implements HomeNotificationOutboundPort {
  constructor(private notificationPort: NotificationInboundPort) {}

  notifyDeviceAction(homeId: string, event: DeviceActionEvent): Promise<void> {
    return this.notificationPort.notifyDeviceAction(homeId, event);
  }

  notifySensorUpdate(homeId: string, event: SensorUpdateEvent): Promise<void> {
    return this.notificationPort.notifySensorUpdate(homeId, event);
  }
}
