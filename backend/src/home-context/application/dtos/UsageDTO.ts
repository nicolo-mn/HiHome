export type UsageRangeDays = 7 | 30;

export type HistoricalWeatherDay = {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  hourlyAirQuality: {
    time: string;
    europeanAqi: number;
  }[];
};

export type HistoricalWeatherSummary = {
  days: HistoricalWeatherDay[];
};

export type UsageReport = {
  rangeDays: UsageRangeDays;
  energyKWhPerWeek: number;
  lightsOnHoursPerWeek: number;
  windowOpenHours: number;
  manualVsAutomated: { manual: number; automated: number };
  activityByHour: number[];
  historicalWeather: HistoricalWeatherSummary | null;
};
