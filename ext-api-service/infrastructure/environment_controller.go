package infrastructure

import (
	"encoding/json"
	"ext-api-service/application"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

type environmentResponse struct {
	Temperature   float64 `json:"temperature"`
	WeatherType   int     `json:"weatherType"`
	WindSpeed     float64 `json:"windSpeed"`
	WindDirection float64 `json:"windDirection"`
	Precipitation float64 `json:"precipitation"`
	EuropeanAQI   int     `json:"europeanAqi"`
}

type dailyForecastResponse struct {
	Date                  string  `json:"date"`
	WeatherType           int     `json:"weatherType"`
	TemperatureMax        float64 `json:"temperatureMax"`
	TemperatureMin        float64 `json:"temperatureMin"`
	WindSpeedMax          float64 `json:"windSpeedMax"`
	WindDirectionDominant float64 `json:"windDirectionDominant"`
	PrecipitationHours    float64 `json:"precipitationHours"`
	DaylightDuration      float64                    `json:"daylightDuration"`
	PrecipitationSum      float64                    `json:"precipitationSum"`
	HourlyAirQuality      []hourlyAirQualityResponse `json:"hourlyAirQuality"`
}

type hourlyAirQualityResponse struct {
	Time        string `json:"time"`
	EuropeanAQI int    `json:"europeanAqi"`
}

type weeklyForecastResponse struct {
	Days []dailyForecastResponse `json:"days"`
}

type EnvironmentController struct {
	service *application.EnvironmentService
}

func NewEnvironmentController(service *application.EnvironmentService) *EnvironmentController {
	return &EnvironmentController{service: service}
}

func (h *EnvironmentController) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("method not allowed for %s", r.URL.Path)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	lat, lon, err := parseCoordinates(r)
	if err != nil {
		log.Printf("invalid coordinates for %s: %v", r.URL.Path, err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("environment request received for lat=%.4f lon=%.4f", lat, lon)

	info, err := h.service.GetEnvironmentInfo(lat, lon)
	if err != nil {
		log.Printf("failed to get environment info: %v", err)
		http.Error(w, "failed to fetch environment data", http.StatusBadGateway)
		return
	}

	resp := environmentResponse{
		Temperature:   info.Temperature(),
		WeatherType:   int(info.WeatherType()),
		WindSpeed:     info.WindSpeed(),
		WindDirection: info.WindDirection(),
		Precipitation: info.Precipitation(),
		EuropeanAQI:   info.EuropeanAQI(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *EnvironmentController) ServeForecast(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("method not allowed for %s", r.URL.Path)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	lat, lon, err := parseCoordinates(r)
	if err != nil {
		log.Printf("invalid coordinates for %s: %v", r.URL.Path, err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("weekly forecast request received for lat=%.4f lon=%.4f", lat, lon)

	forecast, err := h.service.GetWeeklyForecast(lat, lon)
	if err != nil {
		log.Printf("failed to get weekly forecast: %v", err)
		http.Error(w, "failed to fetch weekly forecast", http.StatusBadGateway)
		return
	}

	days := forecast.Days()
	respDays := make([]dailyForecastResponse, 0, len(days))
	for _, day := range days {
		aqiHours := day.HourlyAirQuality()
		respAqi := make([]hourlyAirQualityResponse, 0, len(aqiHours))
		for _, h := range aqiHours {
			respAqi = append(respAqi, hourlyAirQualityResponse{
				Time:        h.Time(),
				EuropeanAQI: h.EuropeanAQI(),
			})
		}
		respDays = append(respDays, dailyForecastResponse{
			Date:                  day.Date(),
			WeatherType:           int(day.WeatherType()),
			TemperatureMax:        day.TemperatureMax(),
			TemperatureMin:        day.TemperatureMin(),
			WindSpeedMax:          day.WindSpeedMax(),
			WindDirectionDominant: day.WindDirectionDominant(),
			PrecipitationHours:    day.PrecipitationHours(),
			DaylightDuration:      day.DaylightDuration(),
			PrecipitationSum:      day.PrecipitationSum(),
			HourlyAirQuality:      respAqi,
		})
	}

	resp := weeklyForecastResponse{Days: respDays}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *EnvironmentController) ServeHistorical(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		log.Printf("method not allowed for %s", r.URL.Path)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	lat, lon, err := parseCoordinates(r)
	if err != nil {
		log.Printf("invalid coordinates for %s: %v", r.URL.Path, err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("historical forecast request received for lat=%.4f lon=%.4f", lat, lon)

	forecast, err := h.service.GetHistoricalForecast(lat, lon)
	if err != nil {
		log.Printf("failed to get historical forecast: %v", err)
		http.Error(w, "failed to fetch historical forecast", http.StatusBadGateway)
		return
	}

	days := forecast.Days()
	respDays := make([]dailyForecastResponse, 0, len(days))
	for _, day := range days {
		aqiHours := day.HourlyAirQuality()
		respAqi := make([]hourlyAirQualityResponse, 0, len(aqiHours))
		for _, h := range aqiHours {
			respAqi = append(respAqi, hourlyAirQualityResponse{
				Time:        h.Time(),
				EuropeanAQI: h.EuropeanAQI(),
			})
		}
		respDays = append(respDays, dailyForecastResponse{
			Date:                  day.Date(),
			WeatherType:           int(day.WeatherType()),
			TemperatureMax:        day.TemperatureMax(),
			TemperatureMin:        day.TemperatureMin(),
			WindSpeedMax:          day.WindSpeedMax(),
			WindDirectionDominant: day.WindDirectionDominant(),
			PrecipitationHours:    day.PrecipitationHours(),
			DaylightDuration:      day.DaylightDuration(),
			PrecipitationSum:      day.PrecipitationSum(),
			HourlyAirQuality:      respAqi,
		})
	}

	resp := weeklyForecastResponse{Days: respDays}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func parseCoordinates(r *http.Request) (float64, float64, error) {
	latStr := r.URL.Query().Get("latitude")
	lonStr := r.URL.Query().Get("longitude")
	if latStr == "" || lonStr == "" {
		return 0, 0, fmt.Errorf("latitude and longitude query parameters are required")
	}
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid latitude value: %s", latStr)
	}
	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid longitude value: %s", lonStr)
	}
	return lat, lon, nil
}
