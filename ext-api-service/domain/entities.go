package domain

type WeatherInfo struct {
	temperature   float64
	weatherType   WeatherType
	windSpeed     float64
	windDirection float64
	precipitation float64
}

type AirQualityInfo struct {
	europeanAQI int
}

type EnvironmentInfo struct {
	weatherInfo    WeatherInfo
	airQualityInfo AirQualityInfo
}

type DailyForecast struct {
	date                  string
	weatherType           WeatherType
	temperatureMax        float64
	temperatureMin        float64
	windSpeedMax          float64
	precipitationHours    float64
	windDirectionDominant float64
	daylightDuration      float64
	precipitationSum      float64
}

type WeeklyForecast struct {
	days []DailyForecast
}

func NewWeatherInfo(temp float64, code int, windSpeed float64, windDir float64, precip float64) WeatherInfo {
	return WeatherInfo{
		temperature:   temp,
		weatherType:   FromWMOCode(code),
		windSpeed:     windSpeed,
		windDirection: windDir,
		precipitation: precip,
	}
}

func NewAirQualityInfo(aqi int) AirQualityInfo {
	return AirQualityInfo{
		europeanAQI: aqi,
	}
}

func NewEnvironmentInfo(weather WeatherInfo, airQuality AirQualityInfo) EnvironmentInfo {
	return EnvironmentInfo{
		weatherInfo:    weather,
		airQualityInfo: airQuality,
	}
}

func NewDailyForecast(date string, weatherCode int, tempMax float64, tempMin float64, windSpeedMax float64, precipHours float64, windDirDominant float64, daylightDuration float64, precipSum float64) DailyForecast {
	return DailyForecast{
		date:                  date,
		weatherType:           FromWMOCode(weatherCode),
		temperatureMax:        tempMax,
		temperatureMin:        tempMin,
		windSpeedMax:          windSpeedMax,
		precipitationHours:    precipHours,
		windDirectionDominant: windDirDominant,
		daylightDuration:      daylightDuration,
		precipitationSum:      precipSum,
	}
}

func NewWeeklyForecast(days []DailyForecast) WeeklyForecast {
	return WeeklyForecast{days: days}
}

func (w EnvironmentInfo) Temperature() float64 {
	return w.weatherInfo.temperature
}

func (w EnvironmentInfo) WeatherType() WeatherType {
	return w.weatherInfo.weatherType
}

func (w EnvironmentInfo) WindSpeed() float64 {
	return w.weatherInfo.windSpeed
}

func (w EnvironmentInfo) WindDirection() float64 {
	return w.weatherInfo.windDirection
}

func (w EnvironmentInfo) Precipitation() float64 {
	return w.weatherInfo.precipitation
}

func (w EnvironmentInfo) EuropeanAQI() int {
	return w.airQualityInfo.europeanAQI
}

func (d DailyForecast) Date() string {
	return d.date
}

func (d DailyForecast) WeatherType() WeatherType {
	return d.weatherType
}

func (d DailyForecast) TemperatureMax() float64 {
	return d.temperatureMax
}

func (d DailyForecast) TemperatureMin() float64 {
	return d.temperatureMin
}

func (d DailyForecast) WindSpeedMax() float64 {
	return d.windSpeedMax
}

func (d DailyForecast) PrecipitationHours() float64 {
	return d.precipitationHours
}

func (d DailyForecast) WindDirectionDominant() float64 {
	return d.windDirectionDominant
}

func (d DailyForecast) DaylightDuration() float64 {
	return d.daylightDuration
}

func (d DailyForecast) PrecipitationSum() float64 {
	return d.precipitationSum
}

func (w WeeklyForecast) Days() []DailyForecast {
	return w.days
}
