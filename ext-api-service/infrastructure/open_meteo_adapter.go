package infrastructure

import (
	"encoding/json"
	"ext-api-service/domain"
	"fmt"
	"net/http"
)

const (
	weatherURL    = "https://api.open-meteo.com/v1/forecast"
	airQualityURL = "https://air-quality-api.open-meteo.com/v1/air-quality"
)

// Structs to parse API responses to avoids adding JSON tags to domain models
type openMeteoWeatherResponse struct {
	Current struct {
		Temperature   float64 `json:"temperature_2m"`
		WeatherCode   int     `json:"weather_code"`
		WindSpeed     float64 `json:"wind_speed_10m"`
		WindDirection float64 `json:"wind_direction_10m"`
		Precipitation float64 `json:"precipitation"`
	} `json:"current"`
}

type openMeteoAirQualityResponse struct {
	Current struct {
		EuropeanAQI int `json:"european_aqi"`
	} `json:"current"`
}

type openMeteoAirQualityHourlyResponse struct {
	Hourly struct {
		Time        []string `json:"time"`
		EuropeanAQI []int    `json:"european_aqi"`
	} `json:"hourly"`
}

type openMeteoWeeklyResponse struct {
	Daily struct {
		Time                  []string  `json:"time"`
		WeatherCode           []int     `json:"weather_code"`
		TemperatureMax        []float64 `json:"temperature_2m_max"`
		TemperatureMin        []float64 `json:"temperature_2m_min"`
		WindSpeedMax          []float64 `json:"wind_speed_10m_max"`
		PrecipitationHours    []float64 `json:"precipitation_hours"`
		WindDirectionDominant []float64 `json:"wind_direction_10m_dominant"`
		DaylightDuration      []float64 `json:"daylight_duration"`
		PrecipitationSum      []float64 `json:"precipitation_sum"`
	} `json:"daily"`
}

type OpenMeteoClient struct {
	httpClient *http.Client
}

func NewOpenMeteoClient(client *http.Client) *OpenMeteoClient {
	if client == nil {
		client = http.DefaultClient
	}
	return &OpenMeteoClient{httpClient: client}
}

func (c *OpenMeteoClient) FetchCurrentEnvironment(lat, lon float64) (*domain.EnvironmentInfo, error) {
	weatherURL := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,precipitation",
		weatherURL, lat, lon,
	)
	resp, err := c.httpClient.Get(weatherURL)
	if err != nil {
		return nil, fmt.Errorf("weather request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weather API returned status %d", resp.StatusCode)
	}

	var weatherResp openMeteoWeatherResponse
	if err := json.NewDecoder(resp.Body).Decode(&weatherResp); err != nil {
		return nil, fmt.Errorf("failed to decode weather response: %w", err)
	}

	aqiURL := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&current=european_aqi",
		airQualityURL, lat, lon,
	)
	aqiResp, err := c.httpClient.Get(aqiURL)
	if err != nil {
		return nil, fmt.Errorf("air quality request failed: %w", err)
	}
	defer aqiResp.Body.Close()

	if aqiResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("air quality API returned status %d", aqiResp.StatusCode)
	}

	var aqiResponse openMeteoAirQualityResponse
	if err := json.NewDecoder(aqiResp.Body).Decode(&aqiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode air quality response: %w", err)
	}

	cur := weatherResp.Current
	info := domain.NewEnvironmentInfo(cur.Temperature, cur.WeatherCode, cur.WindSpeed, cur.WindDirection, cur.Precipitation, aqiResponse.Current.EuropeanAQI)
	return &info, nil
}

func (c *OpenMeteoClient) FetchWeeklyForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	url := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_hours,wind_direction_10m_dominant,daylight_duration,precipitation_sum&timezone=auto&forecast_days=7",
		weatherURL, lat, lon,
	)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("weekly forecast request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weekly forecast API returned status %d", resp.StatusCode)
	}

	var apiResp openMeteoWeeklyResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode weekly forecast response: %w", err)
	}

	daily := apiResp.Daily
	count := len(daily.Time)
	if count == 0 ||
		len(daily.WeatherCode) != count ||
		len(daily.TemperatureMax) != count ||
		len(daily.TemperatureMin) != count ||
		len(daily.WindSpeedMax) != count ||
		len(daily.PrecipitationHours) != count ||
		len(daily.WindDirectionDominant) != count ||
		len(daily.DaylightDuration) != count ||
		len(daily.PrecipitationSum) != count {
		return nil, fmt.Errorf("weekly forecast response has inconsistent daily lengths")
	}

	aqiUrl := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&hourly=european_aqi&timezone=auto&forecast_days=7",
		airQualityURL, lat, lon,
	)
	aqiRespObj, err := c.httpClient.Get(aqiUrl)
	if err != nil {
		return nil, fmt.Errorf("weekly aqi request failed: %w", err)
	}
	defer aqiRespObj.Body.Close()

	if aqiRespObj.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weekly aqi API returned status %d", aqiRespObj.StatusCode)
	}

	var aqiApiResp openMeteoAirQualityHourlyResponse
	if err := json.NewDecoder(aqiRespObj.Body).Decode(&aqiApiResp); err != nil {
		return nil, fmt.Errorf("failed to decode weekly aqi response: %w", err)
	}

	hourly := aqiApiResp.Hourly
	aqiCount := len(hourly.Time)
	if aqiCount == 0 || len(hourly.EuropeanAQI) != aqiCount {
		return nil, fmt.Errorf("weekly aqi response has inconsistent hourly lengths")
	}
	aqiHours := make([]domain.HourlyAirQuality, 0, aqiCount)
	for i := 0; i < aqiCount; i++ {
		aqiHours = append(aqiHours, domain.NewHourlyAirQuality(hourly.Time[i], hourly.EuropeanAQI[i]))
	}

	days := make([]domain.DailyForecast, 0, count)
	for i := 0; i < count; i++ {
		var dailyAqi []domain.HourlyAirQuality
		if (i+1)*24 <= len(aqiHours) {
			dailyAqi = aqiHours[i*24 : (i+1)*24]
		}
		day := domain.NewDailyForecast(
			daily.Time[i],
			daily.WeatherCode[i],
			daily.TemperatureMax[i],
			daily.TemperatureMin[i],
			daily.WindSpeedMax[i],
			daily.PrecipitationHours[i],
			daily.WindDirectionDominant[i],
			daily.DaylightDuration[i],
			daily.PrecipitationSum[i],
			dailyAqi,
		)
		days = append(days, day)
	}

	weekly := domain.NewWeeklyForecast(days)
	return &weekly, nil
}

func (c *OpenMeteoClient) FetchHistoricalData(lat, lon float64) (*domain.WeeklyForecast, error) {
	url := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_hours,wind_direction_10m_dominant,daylight_duration,precipitation_sum&timezone=auto&past_days=7&forecast_days=0",
		weatherURL, lat, lon,
	)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("historical data request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("historical data API returned status %d", resp.StatusCode)
	}

	var apiResp openMeteoWeeklyResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return nil, fmt.Errorf("failed to decode historical data response: %w", err)
	}

	daily := apiResp.Daily
	count := len(daily.Time)
	if count == 0 ||
		len(daily.WeatherCode) != count ||
		len(daily.TemperatureMax) != count ||
		len(daily.TemperatureMin) != count ||
		len(daily.WindSpeedMax) != count ||
		len(daily.PrecipitationHours) != count ||
		len(daily.WindDirectionDominant) != count ||
		len(daily.DaylightDuration) != count ||
		len(daily.PrecipitationSum) != count {
		return nil, fmt.Errorf("historical data response has inconsistent daily lengths")
	}

	aqiUrl := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&hourly=european_aqi&timezone=auto&past_days=7&forecast_days=0",
		airQualityURL, lat, lon,
	)
	aqiRespObj, err := c.httpClient.Get(aqiUrl)
	if err != nil {
		return nil, fmt.Errorf("historical aqi request failed: %w", err)
	}
	defer aqiRespObj.Body.Close()

	if aqiRespObj.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("historical aqi API returned status %d", aqiRespObj.StatusCode)
	}

	var aqiApiResp openMeteoAirQualityHourlyResponse
	if err := json.NewDecoder(aqiRespObj.Body).Decode(&aqiApiResp); err != nil {
		return nil, fmt.Errorf("failed to decode historical aqi response: %w", err)
	}

	hourly := aqiApiResp.Hourly
	aqiCount := len(hourly.Time)
	if aqiCount == 0 || len(hourly.EuropeanAQI) != aqiCount {
		return nil, fmt.Errorf("historical aqi response has inconsistent hourly lengths")
	}
	aqiHours := make([]domain.HourlyAirQuality, 0, aqiCount)
	for i := 0; i < aqiCount; i++ {
		aqiHours = append(aqiHours, domain.NewHourlyAirQuality(hourly.Time[i], hourly.EuropeanAQI[i]))
	}

	days := make([]domain.DailyForecast, 0, count)
	for i := 0; i < count; i++ {
		var dailyAqi []domain.HourlyAirQuality
		if (i+1)*24 <= len(aqiHours) {
			dailyAqi = aqiHours[i*24 : (i+1)*24]
		}
		day := domain.NewDailyForecast(
			daily.Time[i],
			daily.WeatherCode[i],
			daily.TemperatureMax[i],
			daily.TemperatureMin[i],
			daily.WindSpeedMax[i],
			daily.PrecipitationHours[i],
			daily.WindDirectionDominant[i],
			daily.DaylightDuration[i],
			daily.PrecipitationSum[i],
			dailyAqi,
		)
		days = append(days, day)
	}

	weekly := domain.NewWeeklyForecast(days)
	return &weekly, nil
}
