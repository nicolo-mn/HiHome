import { Request, Response } from "express";
import { NotificationInboundPort } from "../../application/NotificationInboundPort";

export class NotificationController {
  constructor(private notificationPort: NotificationInboundPort) {}

  async getNotifications(req: Request, res: Response) {
    try {
      const homeId = req.params.id as string;
      const username = (req as any).user?.username as string;
      const notifications = await this.notificationPort.listByUser(
        homeId,
        username,
      );
      res.json({ notifications });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }
}
