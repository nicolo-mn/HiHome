import type { Coordinates, WeatherForecast } from "../domain";

export type ForecastDaySummary = {
  date: string;
  weatherForecast: WeatherForecast;
  temperatureMax: number;
  temperatureMin: number;
  windSpeedMax: number;
  windDirectionDominant: number;
  precipitationHours: number;
  daylightDuration: number;
  precipitationSum: number;
};

export type ForecastSummary = {
  days: ForecastDaySummary[];
};

export interface ForecastPort {
  getForecastSummary(coords: Coordinates): Promise<ForecastSummary | null>;
}
