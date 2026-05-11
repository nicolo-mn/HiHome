import type { ComponentType } from "../../api/components";

import lightIcon from "./light.svg?raw";
import windowIcon from "./window.svg?raw";
import thermometerIcon from "./thermometer.svg?raw";
import thermostatIcon from "./thermometer.svg?raw";
import airQualityIcon from "./air-quality.svg?raw";
import fallbackIcon from "./fallback.svg?raw";

// Add an entry here for each new component type.
export const componentTypeIcon: Partial<Record<ComponentType, string>> = {
  light: lightIcon,
  window: windowIcon,
  thermostat: thermostatIcon,
};

// Add an entry here for each new sensor type.
export const sensorTypeIcon: Record<string, string> = {
  thermometer: thermometerIcon,
  airquality: airQualityIcon,
};

export { fallbackIcon };
