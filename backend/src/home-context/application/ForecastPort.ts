import type { Coordinates } from "../domain";

export type ForecastSummary = {
  temperature: number;
  weatherDescription: string;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  europeanAqi: number;
};

export interface ForecastPort {
  getForecastSummary(coords: Coordinates): Promise<ForecastSummary | null>;
}
