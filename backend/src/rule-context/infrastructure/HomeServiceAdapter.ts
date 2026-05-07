import { HomeService } from "../../home-context/application/HomeService";
import { HomeServicePort } from "../application/HomeServicePort";

export class HomeServiceAdapter implements HomeServicePort {
  constructor(private homeService: HomeService) {}

  async getCapabilityCatalog(homeId: string) {
    return await this.homeService.getCapabilityCatalog(homeId);
  }
}
