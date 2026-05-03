export interface NotificationPolicy {
  getAirQualityThreshold(homeId: string): number;
  isAirQualitySensor(sensorType: string): boolean;
}

export class DefaultNotificationPolicy implements NotificationPolicy {
  private static readonly DEFAULT_AIR_QUALITY_THRESHOLD = 50;
  // TODO: this type should be the same defined in the home-context
  private static readonly AIR_QUALITY_TYPES = ["airQuality", "air-quality"];

  getAirQualityThreshold(_homeId: string): number {
    return DefaultNotificationPolicy.DEFAULT_AIR_QUALITY_THRESHOLD;
  }

  isAirQualitySensor(sensorType: string): boolean {
    return DefaultNotificationPolicy.AIR_QUALITY_TYPES.includes(sensorType);
  }
}
