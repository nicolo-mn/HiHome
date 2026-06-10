package application

import (
	"fmt"
	"log"

	"ext-api-service/domain"
)

// EnvironmentService fetches weather and air quality data.
type EnvironmentService struct {
	environmentProvider domain.EnvironmentInfoProvider
}

func NewEnvironmentService(wp domain.EnvironmentInfoProvider) *EnvironmentService {
	return &EnvironmentService{
		environmentProvider: wp,
	}
}

// GetEnvironmentInfo fetches weather and air quality data for the given coordinates.
func (s *EnvironmentService) GetEnvironmentInfo(lat, lon float64) (*domain.EnvironmentInfo, error) {
	log.Printf("fetching environment info for lat=%.4f lon=%.4f", lat, lon)
	envInfo, err := s.environmentProvider.FetchCurrentEnvironment(lat, lon)
	if err != nil {
		log.Printf("failed to fetch environment info: %v", err)
		return nil, err
	}

	log.Printf("successfully fetched environment info for lat=%.4f lon=%.4f", lat, lon)
	return envInfo, nil
}

func (s *EnvironmentService) GetWeeklyForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	log.Printf("fetching weekly forecast for lat=%.4f lon=%.4f", lat, lon)
	weeklyForecast, err := s.environmentProvider.FetchWeeklyForecast(lat, lon)
	if err != nil {
		log.Printf("failed to fetch weekly forecast: %v", err)
		return nil, err
	}
	const expectedDays = 7
	if len(weeklyForecast.Days()) != expectedDays {
		log.Printf("weekly forecast has %d days, expected %d", len(weeklyForecast.Days()), expectedDays)
		return nil, fmt.Errorf("weekly forecast must have %d days", expectedDays)
	}

	log.Printf("successfully fetched weekly forecast for lat=%.4f lon=%.4f", lat, lon)
	return weeklyForecast, nil
}

func (s *EnvironmentService) GetHistoricalForecast(lat, lon float64) (*domain.WeeklyForecast, error) {
	log.Printf("fetching historical forecast for lat=%.4f lon=%.4f", lat, lon)

	historicalForecast, err := s.environmentProvider.FetchHistoricalForecast(lat, lon)
	if err != nil {
		log.Printf("failed to fetch historical forecast: %v", err)
		return nil, err
	}

	const expectedDays = 7
	if len(historicalForecast.Days()) != expectedDays {
		log.Printf("historical forecast has %d days, expected %d", len(historicalForecast.Days()), expectedDays)
		return nil, fmt.Errorf("historical forecast must have %d days", expectedDays)
	}

	log.Printf("successfully fetched historical forecast for lat=%.4f lon=%.4f", lat, lon)
	return historicalForecast, nil
}
