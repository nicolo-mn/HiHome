import { SensorUpdatePort } from "../domain/SensorUpdatePort";
import {
  Home,
  TemperatureState,
  AirQualityState,
  WindState,
  WeatherState,
} from "../domain";
import { Socket } from "socket.io";

export class SocketIOSensorUpdateAdapter implements SensorUpdatePort {
  private homeSockets: Map<string, Set<Socket>> = new Map();

  constructor() {}

  private getSockets(homeId: string): Set<Socket> {
    return this.homeSockets.get(homeId) ?? new Set();
  }

  private broadcast(homeId: string, event: string, payload: object): void {
    for (const socket of this.getSockets(homeId)) {
      socket.emit(event, payload);
    }
  }

  async sendInternalTemperatureUpdate(
    home: Home,
    update: TemperatureState,
  ): Promise<void> {
    this.broadcast(home.id, "sensor:internal-temperature", {
      temperature: update.temperature,
    });
  }

  async sendExternalTemperatureUpdate(
    home: Home,
    update: TemperatureState,
  ): Promise<void> {
    this.broadcast(home.id, "sensor:external-temperature", {
      temperature: update.temperature,
    });
  }

  async sendAirQualityUpdate(
    home: Home,
    update: AirQualityState,
  ): Promise<void> {
    this.broadcast(home.id, "sensor:air-quality", {
      AQI: update.AQI,
    });
  }

  async sendWindUpdate(home: Home, update: WindState): Promise<void> {
    this.broadcast(home.id, "sensor:wind", {
      windDirection: update.windDirection,
      windSpeed: update.windSpeed,
    });
  }

  async sendWeatherUpdate(home: Home, update: WeatherState): Promise<void> {
    this.broadcast(home.id, "sensor:weather", {
      forecast: update.forecast,
      precipitation: update.precipitation,
    });
  }

  async registerClient(homeId: string, socket: Socket): Promise<void> {
    if (!this.homeSockets.has(homeId)) {
      this.homeSockets.set(homeId, new Set());
    }
    this.homeSockets.get(homeId)!.add(socket);

    socket.on("disconnect", () => {
      this.homeSockets.get(homeId)?.delete(socket);
      if (this.homeSockets.get(homeId)?.size === 0) {
        this.homeSockets.delete(homeId);
      }
    });
  }
}
