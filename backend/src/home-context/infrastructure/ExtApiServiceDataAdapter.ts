import { ExternalSensorsDataPort } from "../application/ExternalSensorsDataPort";
import type {
  ForecastPort,
  ForecastSummary,
} from "../application/ForecastPort";
import {
  ExternalSensorsUpdate,
  Home,
  WeatherForecast,
  Coordinates,
} from "../domain";

type ExtApiServiceResponse = {
  temperature: number;
  weatherType: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  europeanAqi: number;
};

type ExtApiServiceForecastResponse = {
  days: Array<{
    date: string;
    weatherType: number;
    temperatureMax: number;
    temperatureMin: number;
    windSpeedMax: number;
    windDirectionDominant: number;
    precipitationHours: number;
    daylightDuration: number;
    precipitationSum: number;
  }>;
};

export class ExtApiServiceDataAdapter
  implements ExternalSensorsDataPort, ForecastPort
{
  constructor(
    private readonly baseUrl: string = process.env.EXT_API_BASE_URL ||
      "http://ext-api-service:8080",
  ) {}

  async getExternalSensorsData(home: Home): Promise<ExternalSensorsUpdate> {
    const url = new URL("/api/weather", this.baseUrl);
    url.searchParams.set("latitude", home.coordinates.latitude.toString());
    url.searchParams.set("longitude", home.coordinates.longitude.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Failed to fetch external sensors data: ${response.status}`,
      );
    }

    const payload = (await response.json()) as ExtApiServiceResponse;

    return {
      externalTemperature: { temperature: payload.temperature },
      airQuality: { AQI: payload.europeanAqi },
      wind: {
        windDirection: payload.windDirection,
        windSpeed: payload.windSpeed,
      },
      weather: {
        forecast: this.mapWeatherTypeToForecast(payload.weatherType),
        precipitation: payload.precipitation,
      },
    };
  }

  async getForecastSummary(
    coords: Coordinates,
  ): Promise<ForecastSummary | null> {
    const url = new URL("/api/forecast", this.baseUrl);
    url.searchParams.set("latitude", coords.latitude.toString());
    url.searchParams.set("longitude", coords.longitude.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ExtApiServiceForecastResponse;

    return {
      days: payload.days.map((day) => ({
        date: day.date,
        weatherForecast: this.mapWeatherTypeToForecast(day.weatherType),
        temperatureMax: day.temperatureMax,
        temperatureMin: day.temperatureMin,
        windSpeedMax: day.windSpeedMax,
        windDirectionDominant: day.windDirectionDominant,
        precipitationHours: day.precipitationHours,
        daylightDuration: day.daylightDuration,
        precipitationSum: day.precipitationSum,
      })),
    };
  }

  private mapWeatherTypeToForecast(weatherType: number): WeatherForecast {
    switch (weatherType) {
      case 0:
        return WeatherForecast.Clear;
      case 1:
        return WeatherForecast.Cloudy;
      case 2:
        return WeatherForecast.Overcast;
      case 3:
        return WeatherForecast.Fog;
      case 4:
        return WeatherForecast.Drizzle;
      case 5:
        return WeatherForecast.Rain;
      case 6:
        return WeatherForecast.Snow;
      case 7:
        return WeatherForecast.Thunderstorm;
      default:
        return WeatherForecast.Cloudy;
    }
  }
}
