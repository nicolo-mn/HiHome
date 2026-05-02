package application

import (
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
	weatherInfo, err := s.environmentProvider.FetchCurrentWeather(lat, lon)
	if err != nil {
		return nil, err
	}

	airQualityInfo, err := s.environmentProvider.FetchCurrentAirQuality(lat, lon)
	if err != nil {
		return nil, err
	}

	newEnvInfo := domain.NewEnvironmentInfo(*weatherInfo, *airQualityInfo)
	return &newEnvInfo, nil
}
