import type { ComponentType } from "@/api/components";
import type { SensorReading } from "@/api/sensors";

import lightIcon from "./light.svg?raw";
import windowIcon from "./window.svg?raw";
import thermometerIcon from "./thermometer.svg?raw";
import thermostatIcon from "./thermometer.svg?raw";
import airQualityIcon from "./air-quality.svg?raw";
import fallbackIcon from "./fallback.svg?raw";

import clearDayIcon from "./weather/clear-day.svg?raw";
import partlyCloudyIcon from "./weather/partly-cloudy-day.svg?raw";
import overcastIcon from "./weather/overcast.svg?raw";
import fogIcon from "./weather/fog.svg?raw";
import drizzleIcon from "./weather/drizzle.svg?raw";
import rainIcon from "./weather/rain.svg?raw";
import snowIcon from "./weather/snow.svg?raw";
import thunderstormsIcon from "./weather/thunderstorms.svg?raw";

// Add an entry here for each new component type.
export const componentTypeIcon: Partial<Record<ComponentType, string>> = {
  light: lightIcon,
  window: windowIcon,
  thermostat: thermostatIcon,
};

// Add an entry here for each new sensor type. `weather` is resolved
// separately because its icon depends on the reading's description.
export const sensorTypeIcon: Record<string, string> = {
  thermometer: thermometerIcon,
  airquality: airQualityIcon,
  outdoor_temperature: thermometerIcon,
  outdoor_airquality: airQualityIcon,
};

const weatherDescriptionToIcon: Record<string, string> = {
  Clear: clearDayIcon,
  Drizzle: drizzleIcon,
  Fog: fogIcon,
  Overcast: overcastIcon,
  Cloudy: partlyCloudyIcon,
  Rain: rainIcon,
  Snow: snowIcon,
  Thunderstorm: thunderstormsIcon,
};

export function resolveSensorIcon(reading: SensorReading): string {
  if (reading.type === "weather" && typeof reading.value === "string") {
    return weatherDescriptionToIcon[reading.value] ?? fallbackIcon;
  }
  return sensorTypeIcon[reading.type] ?? fallbackIcon;
}

export { fallbackIcon };
