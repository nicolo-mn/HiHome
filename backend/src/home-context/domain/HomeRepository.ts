import { Device, Home } from ".";

export interface HomeRepository {
  getHome(id: string): Promise<Home | null>;
  getAllHomes(): Promise<Home[]>;
  getDeviceById(id: string): Promise<Device | null>;
  saveHome(home: Home): Promise<void>;
}
