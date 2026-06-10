package application

import (
	"errors"
	"testing"

	"ext-api-service/domain"
)

type stubProvider struct {
	environmentInfo *domain.EnvironmentInfo
	weeklyForecast  *domain.WeeklyForecast
	environmentErr  error
	forecastErr     error
	envCalls        int
	forecastCalls   int
}

func (s *stubProvider) FetchCurrentEnvironment(lat, lon float64) (*domain.EnvironmentInfo, error) {
	s.envCalls++
	return s.environmentInfo, s.environmentErr
}

func (s *stubProvider) FetchWeeklyForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	s.forecastCalls++
	return s.weeklyForecast, s.forecastErr
}

func (s *stubProvider) FetchHistoricalForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	s.forecastCalls++
	return s.weeklyForecast, s.forecastErr
}

// Test that if the environment provider returns an error, the service returns that error
func TestEnvironmentServiceGetEnvironmentInfoError(t *testing.T) {
	provider := &stubProvider{environmentErr: errors.New("fetch failure")}
	service := NewEnvironmentService(provider)

	info, err := service.GetEnvironmentInfo(10.5, 20.5)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if info != nil {
		t.Fatalf("expected nil info, got %#v", info)
	}
	if provider.envCalls != 1 {
		t.Fatalf("expected 1 env call, got %d", provider.envCalls)
	}
}

// test lack of errors on happy path
func TestEnvironmentServiceGetEnvironmentInfoSuccess(t *testing.T) {
	env := domain.NewEnvironmentInfo(12.3, 2, 4.5, 180, 0.1, 42)
	provider := &stubProvider{
		environmentInfo: &env,
	}
	service := NewEnvironmentService(provider)

	info, err := service.GetEnvironmentInfo(10.5, 20.5)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if info == nil {
		t.Fatalf("expected info, got nil")
	}
	if info.Temperature() != 12.3 {
		t.Fatalf("expected temperature 12.3, got %v", info.Temperature())
	}
	if info.WeatherType() != domain.PartlyCloudy {
		t.Fatalf("expected weather type %v, got %v", domain.PartlyCloudy, info.WeatherType())
	}
	if info.EuropeanAQI() != 42 {
		t.Fatalf("expected AQI 42, got %v", info.EuropeanAQI())
	}
}

func TestEnvironmentServiceGetWeeklyForecast(t *testing.T) {
	days := make([]domain.DailyForecast, 0, 7)
	aqi := make([]domain.HourlyAirQuality, 0, 24)
	for h := 0; h < 24; h++ {
		aqi = append(aqi, domain.NewHourlyAirQuality("2026-05-21T00:00", 25))
	}
	for i := 0; i < 7; i++ {
		days = append(days, domain.NewDailyForecast("2026-05-21", 1, 25.0, 15.0, 6.5, 0.2, 90, 36000, 1.0, aqi))
	}
	forecast := domain.NewWeeklyForecast(days)
	provider := &stubProvider{weeklyForecast: &forecast}
	service := NewEnvironmentService(provider)

	result, err := service.GetWeeklyForecast(10.5, 20.5)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if result == nil {
		t.Fatalf("expected forecast, got nil")
	}
	if len(result.Days()) != 7 {
		t.Fatalf("expected 7 days, got %d", len(result.Days()))
	}
	if len(result.Days()[0].HourlyAirQuality()) != 24 {
		t.Fatalf("expected 24 hourly AQI, got %d", len(result.Days()[0].HourlyAirQuality()))
	}
	if result.Days()[0].HourlyAirQuality()[0].EuropeanAQI() != 25 {
		t.Fatalf("expected AQI 25, got %d", result.Days()[0].HourlyAirQuality()[0].EuropeanAQI())
	}
}

func TestEnvironmentServiceGetWeeklyForecastUnexpectedLength(t *testing.T) {
	aqi := make([]domain.HourlyAirQuality, 0, 24)
	for h := 0; h < 24; h++ {
		aqi = append(aqi, domain.NewHourlyAirQuality("2026-05-21T00:00", 25))
	}
	days := []domain.DailyForecast{
		domain.NewDailyForecast("2026-05-21", 1, 25.0, 15.0, 6.5, 0.2, 90, 36000, 1.0, aqi),
	}
	forecast := domain.NewWeeklyForecast(days)
	provider := &stubProvider{weeklyForecast: &forecast}
	service := NewEnvironmentService(provider)

	result, err := service.GetWeeklyForecast(10.5, 20.5)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if result != nil {
		t.Fatalf("expected nil forecast, got %#v", result)
	}
}
