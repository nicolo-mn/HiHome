import { ComponentEvent } from "../../domain";
import { HomeRepository } from "../../domain/HomeRepository";
import { UsageRangeDays, UsageReport } from "../dtos/UsageDTO";
import { OnOffIntervalCalculator } from "../usage/OnOffIntervalCalculator";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TIMEZONE = "Europe/Rome";
export const LIGHT_WATTAGE_W = 10;

type ActivitySummary = {
  manual: number;
  automated: number;
  activityByHour: number[];
};

export class UsageService {
  private readonly lightHours = new OnOffIntervalCalculator({
    onType: "LightTurnedOn",
    offType: "LightTurnedOff",
  });
  private readonly windowHours = new OnOffIntervalCalculator({
    onType: "WindowOpened",
    offType: "WindowClosed",
  });

  constructor(private readonly homeRepo: HomeRepository) {}

  async getUsage(
    homeId: string,
    rangeDays: UsageRangeDays,
    now: Date = new Date(),
  ): Promise<UsageReport> {
    const home = await this.homeRepo.getHome(homeId);
    if (!home) throw new Error(`Home ${homeId} not found`);

    const rangeStart = new Date(now.getTime() - rangeDays * MS_PER_DAY);
    const weeks = rangeDays / 7;

    const lightHoursTotal = this.lightHours.totalOnHours(
      home.eventLog,
      rangeStart,
      now,
    );
    const lightHoursUnion = this.lightHours.unionOnHours(
      home.eventLog,
      rangeStart,
      now,
    );
    const windowHours = this.windowHours.unionOnHours(
      home.eventLog,
      rangeStart,
      now,
    );
    const activity = this.summarizeActivity(home.eventLog, rangeStart, now);

    return {
      rangeDays,
      energyKWhPerWeek: this.round(
        (lightHoursTotal * LIGHT_WATTAGE_W) / 1000 / weeks,
        2,
      ),
      lightsOnHoursPerWeek: this.round(lightHoursUnion / weeks, 2),
      windowOpenHours: this.round(windowHours, 2),
      manualVsAutomated: {
        manual: activity.manual,
        automated: activity.automated,
      },
      activityByHour: activity.activityByHour,
    };
  }

  private summarizeActivity(
    eventLog: ComponentEvent[],
    rangeStart: Date,
    rangeEnd: Date,
  ): ActivitySummary {
    let manual = 0;
    let automated = 0;
    const activityByHour = new Array(24).fill(0);
    for (const event of eventLog) {
      if (event.createdAt < rangeStart || event.createdAt > rangeEnd) continue;
      if (event.actor) manual += 1;
      else automated += 1;
      const hour = new Date(
        event.createdAt.toLocaleString("en-US", { timeZone: TIMEZONE }),
      ).getHours();
      activityByHour[hour] += 1;
    }
    return { manual, automated, activityByHour };
  }

  private round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
}
