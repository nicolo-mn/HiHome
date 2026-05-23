package application

import (
	"errors"
	"testing"

	"ext-api-service/domain"
)

type stubProvider struct {
	weatherInfo    *domain.WeatherInfo
	airQualityInfo *domain.AirQualityInfo
	weeklyForecast *domain.WeeklyForecast
	weatherErr     error
	airQualityErr  error
	forecastErr    error
	weatherCalls   int
	airCalls       int
	forecastCalls  int
}

func (s *stubProvider) FetchCurrentWeather(lat, lon float64) (*domain.WeatherInfo, error) {
	s.weatherCalls++
	return s.weatherInfo, s.weatherErr
}

func (s *stubProvider) FetchCurrentAirQuality(lat, lon float64) (*domain.AirQualityInfo, error) {
	s.airCalls++
	return s.airQualityInfo, s.airQualityErr
}

func (s *stubProvider) FetchWeeklyForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	s.forecastCalls++
	return s.weeklyForecast, s.forecastErr
}

func (s *stubProvider) FetchHistoricalForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	s.forecastCalls++
	return s.weeklyForecast, s.forecastErr
}

// Test that if the weather provider returns an error, the service returns that error and does not call the air quality provider
func TestEnvironmentServiceGetEnvironmentInfoWeatherError(t *testing.T) {
	provider := &stubProvider{weatherErr: errors.New("weather failure")}
	service := NewEnvironmentService(provider)

	info, err := service.GetEnvironmentInfo(10.5, 20.5)
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
	if info != nil {
		t.Fatalf("expected nil info, got %#v", info)
	}
	if provider.airCalls != 0 {
		t.Fatalf("expected air quality not to be called, got %d", provider.airCalls)
	}
}

// test lack of errors on happy path
func TestEnvironmentServiceGetEnvironmentInfoSuccess(t *testing.T) {
	weather := domain.NewWeatherInfo(12.3, 2, 4.5, 180, 0.1)
	air := domain.NewAirQualityInfo(42)
	provider := &stubProvider{
		weatherInfo:    &weather,
		airQualityInfo: &air,
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
	for i := 0; i < 7; i++ {
		days = append(days, domain.NewDailyForecast("2026-05-21", 1, 25.0, 15.0, 6.5, 0.2, 90, 36000, 1.0))
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
}

func TestEnvironmentServiceGetWeeklyForecastUnexpectedLength(t *testing.T) {
	days := []domain.DailyForecast{
		domain.NewDailyForecast("2026-05-21", 1, 25.0, 15.0, 6.5, 0.2, 90, 36000, 1.0),
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
