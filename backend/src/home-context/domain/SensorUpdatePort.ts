import { Home } from "./Home";
import {
  AirQualityState,
  TemperatureState,
  WeatherState,
  WindState,
} from "./SensorsUpdate";

// Sends sensor updates to the frontend
export interface SensorUpdatePort {
  sendInternalTemperatureUpdate(home: Home, update: TemperatureState): void;

  sendExternalTemperatureUpdate(home: Home, update: TemperatureState): void;

  sendAirQualityUpdate(home: Home, update: AirQualityState): void;

  sendWindUpdate(home: Home, update: WindState): void;

  sendWeatherUpdate(home: Home, update: WeatherState): void;
}
