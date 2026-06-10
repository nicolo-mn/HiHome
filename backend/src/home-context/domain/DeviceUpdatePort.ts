import { Device } from "./Device";
import { Home } from "./Home";

// Broadcasts device state changes to connected clients.
export interface DeviceUpdatePort {
  sendDeviceUpdate(home: Home, device: Device): void;
  sendDeviceRemoved(home: Home, deviceId: string): void;
}
