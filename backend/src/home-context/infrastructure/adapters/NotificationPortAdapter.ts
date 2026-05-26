import {
  ComponentActionEvent,
  HomeNotificationOutboundPort,
  SensorUpdateEvent,
} from "../../application/ports/HomeNotificationPort";
import { NotificationInboundPort } from "../../../notification-context/application/NotificationInboundPort";

export class NotificationContextAdapter implements HomeNotificationOutboundPort {
  constructor(private notificationPort: NotificationInboundPort) {}

  notifyComponentAction(
    homeId: string,
    event: ComponentActionEvent,
  ): Promise<void> {
    return this.notificationPort.notifyComponentAction(homeId, event);
  }

  notifySensorUpdate(homeId: string, event: SensorUpdateEvent): Promise<void> {
    return this.notificationPort.notifySensorUpdate(homeId, event);
  }
}
