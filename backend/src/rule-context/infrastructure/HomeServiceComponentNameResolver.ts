import { HomeService } from "../../home-context/application/services/HomeService";
import { ComponentNameResolverPort } from "../application/ComponentNameResolverPort";

export class HomeServiceComponentNameResolver implements ComponentNameResolverPort {
  constructor(private homeService: HomeService) {}

  async getComponentName(componentId: string): Promise<string> {
    const component = await this.homeService.getComponent(componentId);
    return component?.name ?? componentId;
  }
}
