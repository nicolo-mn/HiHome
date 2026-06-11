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

func (s *EnvironmentService) GetHistoricalData(lat, lon float64) (*domain.WeeklyForecast, error) {
	log.Printf("fetching historical data for lat=%.4f lon=%.4f", lat, lon)

	historicalData, err := s.environmentProvider.FetchHistoricalData(lat, lon)
	if err != nil {
		log.Printf("failed to fetch historical data: %v", err)
		return nil, err
	}

	const expectedDays = 7
	if len(historicalData.Days()) != expectedDays {
		log.Printf("historical data has %d days, expected %d", len(historicalData.Days()), expectedDays)
		return nil, fmt.Errorf("historical data must have %d days", expectedDays)
	}

	log.Printf("successfully fetched historical data for lat=%.4f lon=%.4f", lat, lon)
	return historicalData, nil
}
