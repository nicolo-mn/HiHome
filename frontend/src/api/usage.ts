import { apiFetch } from "./client";

export type UsageRange = "week" | "month";

export type UsageReport = {
  rangeDays: 7 | 30;
  energyKWhPerWeek: number;
  lightsOnHoursPerWeek: number;
  avgThermostatCelsius: number | null;
  windowOpenHours: number;
  manualVsAutomated: { manual: number; automated: number };
  activityByHour: number[];
  historicalWeather: {
    days: {
      date: string;
      temperatureMax: number;
      temperatureMin: number;
      precipitationSum: number;
      hourlyAirQuality: { time: string; europeanAqi: number }[];
    }[];
  } | null;
};

export async function getUsage(
  homeId: string,
  range: UsageRange,
): Promise<UsageReport> {
  return apiFetch<UsageReport>(
    `/api/v1/home/${encodeURIComponent(homeId)}/usage?range=${range}`,
  );
}
