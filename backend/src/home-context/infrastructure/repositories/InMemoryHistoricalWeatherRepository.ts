import type { HistoricalWeatherRepository } from "../../application/HistoricalWeatherRepository";
import type { HistoricalWeatherSummary } from "../../application/dtos/UsageDTO";

export class InMemoryHistoricalWeatherRepository implements HistoricalWeatherRepository {
  private readonly dataByHome = new Map<string, HistoricalWeatherSummary>();

  getByHomeId(homeId: string): HistoricalWeatherSummary | null {
    return this.dataByHome.get(homeId) || null;
  }

  setForHome(homeId: string, data: HistoricalWeatherSummary): void {
    this.dataByHome.set(homeId, data);
  }
}
