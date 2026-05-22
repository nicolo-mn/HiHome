import { Server } from "socket.io";
import { SensorUpdatePort } from "../domain/SensorUpdatePort";
import { HomeNotificationOutboundPort } from "../application/HomeNotificationPort";
import {
  Home,
  TemperatureState,
  AirQualityState,
  WindState,
  WeatherState,
} from "../domain";

export class SocketIOSensorUpdateAdapter implements SensorUpdatePort {
  constructor(
    private io: Server,
    private notificationPort?: HomeNotificationOutboundPort,
  ) {}

  private broadcast(homeId: string, event: string, payload: object): void {
    this.io.to(`home-${homeId}`).emit(event, payload);
  }

  sendInternalTemperatureUpdate(home: Home, update: TemperatureState): void {
    this.broadcast(home.id, "sensor:internal-temperature", {
      temperature: update.temperature,
    });
  }

  sendExternalTemperatureUpdate(home: Home, update: TemperatureState): void {
    this.broadcast(home.id, "sensor:external-temperature", {
      temperature: update.temperature,
    });
  }

  sendAirQualityUpdate(home: Home, update: AirQualityState): void {
    this.broadcast(home.id, "sensor:air-quality", {
      AQI: update.AQI,
    });

    if (!this.notificationPort) return;

    this.notificationPort
      .notifySensorUpdate(home.id, {
        sensorType: "air-quality",
        value: update.AQI,
        measureUnit: "AQI",
      })
      .catch((error) => console.error("Notification delivery failed", error));
  }

  sendWindUpdate(home: Home, update: WindState): void {
    this.broadcast(home.id, "sensor:wind", {
      windDirection: update.windDirection,
      windSpeed: update.windSpeed,
    });
  }

  sendWeatherUpdate(home: Home, update: WeatherState): void {
    this.broadcast(home.id, "sensor:weather", {
      forecast: update.forecast,
      precipitation: update.precipitation,
    });
  }
}
