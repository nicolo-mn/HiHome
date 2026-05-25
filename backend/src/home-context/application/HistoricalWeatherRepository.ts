import type { HistoricalWeatherSummary } from "./dtos/UsageDTO";

export interface HistoricalWeatherRepository {
  getByHomeId(homeId: string): HistoricalWeatherSummary | null;
  setForHome(homeId: string, data: HistoricalWeatherSummary): void;
}
