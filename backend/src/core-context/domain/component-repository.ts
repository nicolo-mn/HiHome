import { HomeComponent, ComponentStatus } from "./home-component";

export interface ComponentRepository {
  findByHomeId(homeId: string): Promise<HomeComponent[]>;
  updateStatus(
    componentId: string,
    homeId: string,
    status: ComponentStatus,
  ): Promise<HomeComponent | null>;
}
