export interface DeviceNameResolverPort {
  getDeviceName(deviceId: string): Promise<string>;
}
