package domain

// EnvironmentInfoProvider is the port for fetching environment information from an external source.
type EnvironmentInfoProvider interface {
	FetchCurrentEnvironment(lat, lon float64) (*EnvironmentInfo, error)
	FetchWeeklyForecast(lat, lon float64) (*WeeklyForecast, error)
	FetchHistoricalForecast(lat, lon float64) (*WeeklyForecast, error)
}
