package infrastructure

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"ext-api-service/application"
	"ext-api-service/domain"
)

type stubEnvironmentProvider struct {
	environmentInfo *domain.EnvironmentInfo
	weeklyForecast  *domain.WeeklyForecast
	environmentErr  error
	forecastErr     error
}

func (s *stubEnvironmentProvider) FetchCurrentEnvironment(lat, lon float64) (*domain.EnvironmentInfo, error) {
	return s.environmentInfo, s.environmentErr
}

func (s *stubEnvironmentProvider) FetchWeeklyForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	return s.weeklyForecast, s.forecastErr
}

func (s *stubEnvironmentProvider) FetchHistoricalData(lat, lon float64) (*domain.WeeklyForecast, error) {
	return s.weeklyForecast, s.forecastErr
}

// error on post for /api/v1/environment/current
func TestEnvironmentControllerServeHTTPMethodNotAllowed(t *testing.T) {
	provider := &stubEnvironmentProvider{}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/environment/current", nil)
	rec := httptest.NewRecorder()
	controller.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status %d, got %d", http.StatusMethodNotAllowed, rec.Code)
	}
}

// error on missing query params for /api/v1/environment/current
func TestEnvironmentControllerServeHTTPBadRequest(t *testing.T) {
	provider := &stubEnvironmentProvider{}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/environment/current", nil)
	rec := httptest.NewRecorder()
	controller.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

// error on environment provider failure for /api/v1/environment/current
func TestEnvironmentControllerServeHTTPBadGateway(t *testing.T) {
	provider := &stubEnvironmentProvider{environmentErr: errors.New("environment failure")}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/environment/current?latitude=45&longitude=9", nil)
	rec := httptest.NewRecorder()
	controller.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected status %d, got %d", http.StatusBadGateway, rec.Code)
	}
}

// test successful response for /api/v1/environment/current
func TestEnvironmentControllerServeHTTPSuccess(t *testing.T) {
	env := domain.NewEnvironmentInfo(18.5, 2, 5.1, 200, 0.0, 30)
	provider := &stubEnvironmentProvider{
		environmentInfo: &env,
	}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/environment/current?latitude=45&longitude=9", nil)
	rec := httptest.NewRecorder()
	controller.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if contentType := rec.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("expected content type application/json, got %s", contentType)
	}

	var resp environmentResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp.Temperature != 18.5 {
		t.Fatalf("expected temperature 18.5, got %v", resp.Temperature)
	}
	if resp.WeatherType != int(domain.PartlyCloudy) {
		t.Fatalf("expected weather type %d, got %d", int(domain.PartlyCloudy), resp.WeatherType)
	}
	if resp.EuropeanAQI != 30 {
		t.Fatalf("expected AQI 30, got %d", resp.EuropeanAQI)
	}
}

// error on post for /api/v1/environment/forecast
func TestEnvironmentControllerServeForecastMethodNotAllowed(t *testing.T) {
	provider := &stubEnvironmentProvider{}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/environment/forecast", nil)
	rec := httptest.NewRecorder()
	controller.ServeForecast(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status %d, got %d", http.StatusMethodNotAllowed, rec.Code)
	}
}

// error on missing query params for /api/v1/environment/forecast
func TestEnvironmentControllerServeForecastBadRequest(t *testing.T) {
	provider := &stubEnvironmentProvider{}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/environment/forecast", nil)
	rec := httptest.NewRecorder()
	controller.ServeForecast(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}
}

// error on forecast provider failure for /api/v1/environment/forecast
func TestEnvironmentControllerServeForecastBadGateway(t *testing.T) {
	provider := &stubEnvironmentProvider{forecastErr: errors.New("forecast failure")}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/environment/forecast?latitude=45&longitude=9", nil)
	rec := httptest.NewRecorder()
	controller.ServeForecast(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected status %d, got %d", http.StatusBadGateway, rec.Code)
	}
}

// error on invalid forecast length for /api/v1/environment/forecast
func TestEnvironmentControllerServeForecastInvalidLength(t *testing.T) {
	aqi := make([]domain.HourlyAirQuality, 0, 24)
	for h := 0; h < 24; h++ {
		aqi = append(aqi, domain.NewHourlyAirQuality("2026-05-21T00:00", 30))
	}
	days := []domain.DailyForecast{
		domain.NewDailyForecast("2026-05-21", 1, 26.0, 16.0, 7.2, 0.0, 120, 36000, 0.5, aqi),
	}
	forecast := domain.NewWeeklyForecast(days)
	provider := &stubEnvironmentProvider{weeklyForecast: &forecast}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/environment/forecast?latitude=45&longitude=9", nil)
	rec := httptest.NewRecorder()
	controller.ServeForecast(rec, req)

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected status %d, got %d", http.StatusBadGateway, rec.Code)
	}
}

// test successful response for /api/v1/environment/forecast
func TestEnvironmentControllerServeForecastSuccess(t *testing.T) {
	days := make([]domain.DailyForecast, 0, 7)
	aqi := make([]domain.HourlyAirQuality, 0, 24)
	for h := 0; h < 24; h++ {
		aqi = append(aqi, domain.NewHourlyAirQuality("2026-05-21T00:00", 30))
	}
	for i := 0; i < 7; i++ {
		days = append(days, domain.NewDailyForecast("2026-05-21", 1, 26.0, 16.0, 7.2, 0.0, 120, 36000, 0.5, aqi))
	}
	forecast := domain.NewWeeklyForecast(days)
	provider := &stubEnvironmentProvider{weeklyForecast: &forecast}
	service := application.NewEnvironmentService(provider)
	controller := NewEnvironmentController(service)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/environment/forecast?latitude=45&longitude=9", nil)
	rec := httptest.NewRecorder()
	controller.ServeForecast(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, rec.Code)
	}
	if contentType := rec.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("expected content type application/json, got %s", contentType)
	}

	var resp weeklyForecastResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(resp.Days) != 7 {
		t.Fatalf("expected 7 days, got %d", len(resp.Days))
	}
	if resp.Days[0].Date != "2026-05-21" {
		t.Fatalf("expected first date 2026-05-21, got %s", resp.Days[0].Date)
	}
	if resp.Days[1].WeatherType != int(domain.ClearDay) {
		t.Fatalf("expected second weather type %d, got %d", int(domain.ClearDay), resp.Days[1].WeatherType)
	}
	if len(resp.Days[0].HourlyAirQuality) != 24 {
		t.Fatalf("expected 24 hourly AQI, got %d", len(resp.Days[0].HourlyAirQuality))
	}
	if resp.Days[0].HourlyAirQuality[0].EuropeanAQI != 30 {
		t.Fatalf("expected AQI 30, got %d", resp.Days[0].HourlyAirQuality[0].EuropeanAQI)
	}
	if resp.Days[0].HourlyAirQuality[0].Time != "2026-05-21T00:00" {
		t.Fatalf("expected AQI time 2026-05-21T00:00, got %s", resp.Days[0].HourlyAirQuality[0].Time)
	}
}
