import { HomeService } from "../../../home-context/application/services/HomeService";
import { DeviceNameResolverPort } from "../../application/ports/DeviceNameResolverPort";

export class HomeServiceDeviceNameResolver implements DeviceNameResolverPort {
  constructor(private homeService: HomeService) {}

  async getDeviceName(deviceId: string): Promise<string> {
    const device = await this.homeService.getDevice(deviceId);
    return device?.name ?? deviceId;
  }
}
