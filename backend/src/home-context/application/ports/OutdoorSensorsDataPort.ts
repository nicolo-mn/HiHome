import { OutdoorSensorsUpdate, Home } from "../../domain";

// Gets outdoor sensors data for a given home
export interface OutdoorSensorsDataPort {
  getOutdoorSensorsData(home: Home): Promise<OutdoorSensorsUpdate>;
}
