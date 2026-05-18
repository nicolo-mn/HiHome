export interface NotificationPolicy {
  getAirQualityThreshold(homeId: string): number;
  isAirQualitySensor(sensorType: string): boolean;
}

export class DefaultNotificationPolicy implements NotificationPolicy {
  private static readonly DEFAULT_AIR_QUALITY_THRESHOLD = 100; // Threshold for acceptable air quality
  private static readonly AIR_QUALITY_TYPES = ["air-quality"];

  getAirQualityThreshold(_homeId: string): number {
    return DefaultNotificationPolicy.DEFAULT_AIR_QUALITY_THRESHOLD;
  }

  isAirQualitySensor(sensorType: string): boolean {
    return DefaultNotificationPolicy.AIR_QUALITY_TYPES.includes(sensorType);
  }
}
