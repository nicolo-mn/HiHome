import { Home, Room } from ".";

export interface HomeRepository {
  getHome(id: string): Promise<Home | null>;
  saveHome(home: Home): Promise<void>;
}
