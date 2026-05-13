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

type EnvironmentController struct {
	service *application.EnvironmentService
}

func NewEnvironmentController(service *application.EnvironmentService) *EnvironmentController {
	return &EnvironmentController{service: service}
}

func (h *EnvironmentController) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	lat, lon, err := parseCoordinates(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

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
