import { NotificationInboundPort } from "../../../notification-context/application/ports/NotificationInboundPort";
import {
  RuleNotificationPort,
  RulesExecutedEvent,
} from "../../application/ports/RuleNotificationPort";

export class NotificationContextAdapter implements RuleNotificationPort {
  constructor(private notificationPort: NotificationInboundPort) {}

  notifyRulesExecuted(
    homeId: string,
    event: RulesExecutedEvent,
  ): Promise<void> {
    return this.notificationPort.notifyRulesExecuted(homeId, event);
  }
}
