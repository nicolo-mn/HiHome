import { ExternalSensorsDataPort } from "../application/ExternalSensorsDataPort";
import { ExternalSensorsUpdate, Home, WeatherForecast } from "../domain";

type ExtApiServiceResponse = {
  temperature: number;
  weatherType: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  europeanAqi: number;
};

export class ExtApiServiceDataAdapter implements ExternalSensorsDataPort {
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
