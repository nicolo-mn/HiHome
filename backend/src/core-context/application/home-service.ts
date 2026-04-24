import { ComponentRepository } from "../domain/component-repository";
import { HomeComponent, ComponentStatus } from "../domain/home-component";
import { SensorReading } from "../domain/sensor-reading";

const WEATHER_CONDITIONS = [
  "sunny",
  "cloudy",
  "rainy",
  "partly_cloudy",
  "stormy",
] as const;

export class HomeService {
  constructor(private readonly componentRepository: ComponentRepository) {}

  async getComponents(homeId: string): Promise<HomeComponent[]> {
    return this.componentRepository.findByHomeId(homeId);
  }

  async updateComponentStatus(
    componentId: string,
    homeId: string,
    status: ComponentStatus,
  ): Promise<HomeComponent | null> {
    return this.componentRepository.updateStatus(componentId, homeId, status);
  }

  generateSensorReadings(): SensorReading[] {
    const temperature = new SensorReading(
      "temperature",
      Math.round((Math.random() * 20 + 15) * 10) / 10,
      "°C",
    );

    const weather = new SensorReading(
      "weather",
      WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)],
      "",
    );

    const airQuality = new SensorReading(
      "air_quality",
      Math.round(Math.random() * 200),
      "AQI",
    );

    return [temperature, weather, airQuality];
  }
}
