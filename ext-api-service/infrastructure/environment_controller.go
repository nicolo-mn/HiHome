package infrastructure

import (
	"encoding/base64"
	"encoding/json"
	"ext-api-service/application"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
)

type environmentResponse struct {
	Temperature        float64 `json:"temperature"`
	WeatherDescription string  `json:"weatherDescription"`
	WindSpeed          float64 `json:"windSpeed"`
	WindDirection      float64 `json:"windDirection"`
	Precipitation      float64 `json:"precipitation"`
	EuropeanAQI        int     `json:"europeanAqi"`
	Image              string  `json:"image"`
}

type EnvironmentController struct {
	service  *application.EnvironmentService
	imageDir string
}

func NewEnvironmentController(service *application.EnvironmentService, imageDir string) *EnvironmentController {
	return &EnvironmentController{service: service, imageDir: imageDir}
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

	icon := weatherDescriptionToIcon[info.WeatherDescription()]
	imagePath := h.imageDir + "/" + icon.filename()
	var imageBase64 string
	if data, err := os.ReadFile(imagePath); err == nil {
		imageBase64 = base64.StdEncoding.EncodeToString(data)
	} else {
		log.Printf("failed to read image: %v", err)
	}

	resp := environmentResponse{
		Temperature:        info.Temperature(),
		WeatherDescription: info.WeatherDescription().String(),
		WindSpeed:          info.WindSpeed(),
		WindDirection:      info.WindDirection(),
		Precipitation:      info.Precipitation(),
		EuropeanAQI:        info.EuropeanAQI(),
		Image:              imageBase64,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func parseCoordinates(r *http.Request) (float64, float64, error) {
	latStr := r.URL.Query().Get("lat")
	lonStr := r.URL.Query().Get("lon")
	if latStr == "" || lonStr == "" {
		return 0, 0, fmt.Errorf("lat and lon query parameters are required")
	}
	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid lat value: %s", latStr)
	}
	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("invalid lon value: %s", lonStr)
	}
	return lat, lon, nil
}
