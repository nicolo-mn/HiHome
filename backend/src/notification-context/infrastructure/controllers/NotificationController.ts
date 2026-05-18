import { Request, Response } from "express";
import { NotificationInboundPort } from "../../application/NotificationInboundPort";

export class NotificationController {
  constructor(private notificationPort: NotificationInboundPort) {}

  async getNotifications(req: Request, res: Response) {
    try {
      const notifications = await this.notificationPort.listByHome(
        req.params.id as string,
      );
      res.json({ notifications });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }
}
