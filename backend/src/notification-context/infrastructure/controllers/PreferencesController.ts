import { Request, Response } from "express";
import { ALL_NOTIFICATION_TYPES } from "../../domain/Notification";
import { PreferencesService } from "../../application/services/PreferencesService";

export class PreferencesController {
  constructor(private preferencesService: PreferencesService) {}

  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const homeId = req.params.homeId as string;
      const username = (req as any).user?.username as string;
      const prefs = await this.preferencesService.getPreferences(
        homeId,
        username,
      );
      res.json({ notificationPreferences: prefs });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }

  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const homeId = req.params.homeId as string;
      const username = (req as any).user?.username as string;
      const { notificationPreferences } = req.body;

      if (
        !Array.isArray(notificationPreferences) ||
        !notificationPreferences.every((t: unknown) =>
          (ALL_NOTIFICATION_TYPES as readonly string[]).includes(t as string),
        )
      ) {
        res.status(400).json({
          error: `notificationPreferences must be an array of valid types: ${ALL_NOTIFICATION_TYPES.join(", ")}`,
        });
        return;
      }

      await this.preferencesService.updatePreferences(
        homeId,
        username,
        notificationPreferences,
      );
      res.json({ notificationPreferences });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
}
