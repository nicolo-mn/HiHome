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

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      console.error(
        `Failed to reach ext-api-service for home ${home.id} at ${url.toString()}:`,
        error,
      );
      throw error;
    }
    if (!response.ok) {
      console.error(
        `ext-api-service responded with status ${response.status} for home ${home.id} at ${url.toString()}`,
      );
      throw new Error(
        `Failed to fetch external sensors data: ${response.status}`,
      );
    }

    let payload: ExtApiServiceResponse;
    try {
      payload = (await response.json()) as ExtApiServiceResponse;
    } catch (error) {
      console.error(
        `Failed to parse ext-api-service response for home ${home.id} at ${url.toString()}:`,
        error,
      );
      throw error;
    }

    const result = {
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
    console.log(
      `Successfully received external sensors data for home ${home.id}: temp=${result.externalTemperature.temperature}, AQI=${result.airQuality.AQI}`,
    );
    return result;
  }

  async getForecastSummary(
    coords: Coordinates,
  ): Promise<ForecastSummary | null> {
    const url = new URL("/api/forecast", this.baseUrl);
    url.searchParams.set("latitude", coords.latitude.toString());
    url.searchParams.set("longitude", coords.longitude.toString());

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (error) {
      console.error(
        `Failed to reach ext-api-service for forecast at ${url.toString()}:`,
        error,
      );
      return null;
    }
    if (!response.ok) {
      console.error(
        `ext-api-service responded with status ${response.status} for forecast at ${url.toString()}`,
      );
      return null;
    }

    let payload: ExtApiServiceForecastResponse;
    try {
      payload = (await response.json()) as ExtApiServiceForecastResponse;
    } catch (error) {
      console.error(
        `Failed to parse ext-api-service forecast response at ${url.toString()}:`,
        error,
      );
      return null;
    }

    const result = {
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
    console.log(
      `Successfully received forecast summary for coordinates (${coords.latitude}, ${coords.longitude})`,
    );
    return result;
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
