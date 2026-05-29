import { Home } from "./Home";
import {
  AirQualityState,
  TemperatureState,
  WeatherState,
  WindState,
} from "./SensorsUpdate";

// Sends sensor updates to the frontend
export interface SensorUpdatePort {
  sendIndoorTemperatureUpdate(home: Home, update: TemperatureState): void;

  sendOutdoorTemperatureUpdate(home: Home, update: TemperatureState): void;

  sendAirQualityUpdate(home: Home, update: AirQualityState): void;

  sendWindUpdate(home: Home, update: WindState): void;

  sendWeatherUpdate(home: Home, update: WeatherState): void;
}
