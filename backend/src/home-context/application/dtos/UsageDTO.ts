export type UsageRangeDays = 7 | 30;

export type UsageReport = {
  rangeDays: UsageRangeDays;
  energyKWhPerWeek: number;
  lightsOnHoursPerWeek: number;
  windowOpenHours: number;
  manualVsAutomated: { manual: number; automated: number };
  activityByHour: number[];
};
