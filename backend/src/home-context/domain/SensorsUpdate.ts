export enum WeatherForecast {
  Clear,
  Drizzle,
  Fog,
  Overcast,
  Cloudy,
  Rain,
  Snow,
  Thunderstorm,
}

export type TemperatureState = {
  temperature: number;
};

export type AirQualityState = {
  AQI: number;
};

export type WindState = {
  windDirection: number;
  windSpeed: number;
};

export type WeatherState = {
  forecast: WeatherForecast;
};

export type ExternalSensorsUpdate = {
  externalTemperature: TemperatureState;
  airQuality: AirQualityState;
  wind: WindState;
  weather: WeatherState;
};

export type SensorState = {
  externalSensors?: ExternalSensorsUpdate;
  internalTemperature?: TemperatureState;
};
