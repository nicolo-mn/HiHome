package infrastructure

import "ext-api-service/domain"

type weatherIcon int

const (
	iconClearDay weatherIcon = iota
	iconPartlyCloudy
	iconOvercast
	iconFog
	iconDrizzle
	iconRain
	iconSnow
	iconThunderstorm
)

var iconFilenames = map[weatherIcon]string{
	iconClearDay:     "clear-day.svg",
	iconPartlyCloudy: "partly-cloudy-day.svg",
	iconOvercast:     "overcast.svg",
	iconFog:          "fog.svg",
	iconDrizzle:      "drizzle.svg",
	iconRain:         "rain.svg",
	iconSnow:         "snow.svg",
	iconThunderstorm: "thunderstorms.svg",
}

func (i weatherIcon) filename() string {
	if name, ok := iconFilenames[i]; ok {
		return name
	}
	return "clear-day.svg"
}

var conditionToIcon = map[domain.WeatherCondition]weatherIcon{
	domain.ConditionClearSky:               iconClearDay,
	domain.ConditionMainlyClear:            iconClearDay,
	domain.ConditionPartlyCloudy:           iconPartlyCloudy,
	domain.ConditionOvercast:               iconOvercast,
	domain.ConditionFog:                    iconFog,
	domain.ConditionDepositingRimeFog:      iconFog,
	domain.ConditionLightDrizzle:           iconDrizzle,
	domain.ConditionModerateDrizzle:        iconDrizzle,
	domain.ConditionDenseDrizzle:           iconDrizzle,
	domain.ConditionLightFreezingDrizzle:   iconDrizzle,
	domain.ConditionDenseFreezingDrizzle:   iconDrizzle,
	domain.ConditionSlightRain:             iconRain,
	domain.ConditionModerateRain:           iconRain,
	domain.ConditionHeavyRain:              iconRain,
	domain.ConditionLightFreezingRain:      iconRain,
	domain.ConditionHeavyFreezingRain:      iconRain,
	domain.ConditionSlightRainShowers:      iconRain,
	domain.ConditionModerateRainShowers:    iconRain,
	domain.ConditionViolentRainShowers:     iconRain,
	domain.ConditionSlightSnowFall:         iconSnow,
	domain.ConditionModerateSnowFall:       iconSnow,
	domain.ConditionHeavySnowFall:          iconSnow,
	domain.ConditionSnowGrains:             iconSnow,
	domain.ConditionSlightSnowShowers:      iconSnow,
	domain.ConditionHeavySnowShowers:       iconSnow,
	domain.ConditionThunderstorm:           iconThunderstorm,
	domain.ConditionThunderstormSlightHail: iconThunderstorm,
	domain.ConditionThunderstormHeavyHail:  iconThunderstorm,
}
