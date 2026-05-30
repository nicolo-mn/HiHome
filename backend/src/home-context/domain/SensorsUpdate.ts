export enum WeatherForecast {
  Clear = "Clear",
  Drizzle = "Drizzle",
  Fog = "Fog",
  Overcast = "Overcast",
  Cloudy = "Cloudy",
  Rain = "Rain",
  Snow = "Snow",
  Thunderstorm = "Thunderstorm",
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
  precipitation: number;
};

export type OutdoorSensorsUpdate = {
  outdoorTemperature: TemperatureState;
  airQuality: AirQualityState;
  wind: WindState;
  weather: WeatherState;
};

export type SensorState = {
  outdoorSensors?: OutdoorSensorsUpdate;
  indoorTemperature?: TemperatureState;
};
