import { Request, Response } from "express";
import { NotificationInboundPort } from "../../application/NotificationInboundPort";
import {
  PreferencesRepository,
  ALL_NOTIFICATION_TYPES,
} from "../../../user-context/domain/PreferencesRepository";

export class NotificationController {
  constructor(
    private notificationPort: NotificationInboundPort,
    private prefsRepo: PreferencesRepository,
  ) {}

  async getNotifications(req: Request, res: Response) {
    try {
      const homeId = req.params.id as string;
      const username = (req as any).user?.username as string;
      const allowedTypes = (await this.prefsRepo.findPreferences(
        homeId,
        username,
      )) ?? [...ALL_NOTIFICATION_TYPES];
      const notifications = await this.notificationPort.listByHomeFiltered(
        homeId,
        allowedTypes,
      );
      res.json({ notifications });
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }
}
