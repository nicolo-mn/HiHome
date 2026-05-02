package domain

// EnvironmentInfoProvider is the port for fetching environment information from an external source.
type EnvironmentInfoProvider interface {
	FetchCurrentWeather(lat, lon float64) (*WeatherInfo, error)
	FetchCurrentAirQuality(lat, lon float64) (*AirQualityInfo, error)
}
