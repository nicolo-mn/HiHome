package domain

type WeatherInfo struct {
	temperature        float64
	weatherDescription WeatherDescription
	windSpeed          float64
	windDirection      float64
	precipitation      float64
}

type AirQualityInfo struct {
	europeanAQI int
}

type EnvironmentInfo struct {
	weatherInfo    WeatherInfo
	airQualityInfo AirQualityInfo
}

func NewWeatherInfo(temp float64, code int, windSpeed float64, windDir float64, precip float64) WeatherInfo {
	return WeatherInfo{
		temperature:        temp,
		weatherDescription: FromWMOCode(code),
		windSpeed:          windSpeed,
		windDirection:      windDir,
		precipitation:      precip,
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

func (w EnvironmentInfo) Temperature() float64 {
	return w.weatherInfo.temperature
}

func (w EnvironmentInfo) WeatherDescription() WeatherDescription {
	return w.weatherInfo.weatherDescription
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
