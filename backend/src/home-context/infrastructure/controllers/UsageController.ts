import { Request, Response } from "express";
import { UsageService } from "../../application/services/UsageService";

export class UsageController {
  constructor(private usageService: UsageService) {}

  async getUsage(req: Request, res: Response) {
    const range = req.query.range;
    let rangeDays: 7 | 30;
    if (range === "month") rangeDays = 30;
    else if (range === "week" || range === undefined) rangeDays = 7;
    else return res.status(400).json({ error: "range must be week or month" });

    try {
      const report = await this.usageService.getUsage(
        req.params.id as string,
        rangeDays,
      );
      res.json(report);
    } catch (e: any) {
      res.status(404).json({ error: e.message });
    }
  }
}
