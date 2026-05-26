import { ExternalSensorsUpdate, Home } from "../domain";

// Gets external sensors data for a given home
export interface ExternalSensorsDataPort {
  getExternalSensorsData(home: Home): Promise<ExternalSensorsUpdate>;
}
