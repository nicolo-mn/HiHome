package domain

// Represents the current environmental conditions
type EnvironmentInfo struct {
	temperature   float64
	weatherType   WeatherType
	windSpeed     float64
	windDirection float64
	precipitation float64
	europeanAQI   int
}

// Represents the environment information for a single day
// Used for both forecasts and historical data
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
	hourlyAirQuality      []HourlyAirQuality
}

type HourlyAirQuality struct {
	time        string
	europeanAQI int
}

type WeeklyForecast struct {
	days []DailyForecast
}

func NewEnvironmentInfo(temp float64, weatherCode int, windSpeed float64, windDir float64, precip float64, aqi int) EnvironmentInfo {
	return EnvironmentInfo{
		temperature:   temp,
		weatherType:   FromWMOCode(weatherCode),
		windSpeed:     windSpeed,
		windDirection: windDir,
		precipitation: precip,
		europeanAQI:   aqi,
	}
}

func NewDailyForecast(date string, weatherCode int, tempMax float64, tempMin float64, windSpeedMax float64, precipHours float64, windDirDominant float64, daylightDuration float64, precipSum float64, aqi []HourlyAirQuality) DailyForecast {
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
		hourlyAirQuality:      aqi,
	}
}

func NewHourlyAirQuality(time string, aqi int) HourlyAirQuality {
	return HourlyAirQuality{
		time:        time,
		europeanAQI: aqi,
	}
}

func NewWeeklyForecast(days []DailyForecast) WeeklyForecast {
	return WeeklyForecast{days: days}
}

func (e EnvironmentInfo) Temperature() float64 {
	return e.temperature
}

func (e EnvironmentInfo) WeatherType() WeatherType {
	return e.weatherType
}

func (e EnvironmentInfo) WindSpeed() float64 {
	return e.windSpeed
}

func (e EnvironmentInfo) WindDirection() float64 {
	return e.windDirection
}

func (e EnvironmentInfo) Precipitation() float64 {
	return e.precipitation
}

func (e EnvironmentInfo) EuropeanAQI() int {
	return e.europeanAQI
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

func (h HourlyAirQuality) Time() string {
	return h.time
}

func (h HourlyAirQuality) EuropeanAQI() int {
	return h.europeanAQI
}

func (d DailyForecast) HourlyAirQuality() []HourlyAirQuality {
	return d.hourlyAirQuality
}
