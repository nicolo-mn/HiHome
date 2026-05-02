package domain

type WeatherCondition int

const (
	ConditionClearSky WeatherCondition = iota
	ConditionMainlyClear
	ConditionPartlyCloudy
	ConditionOvercast
	ConditionFog
	ConditionDepositingRimeFog
	ConditionLightDrizzle
	ConditionModerateDrizzle
	ConditionDenseDrizzle
	ConditionLightFreezingDrizzle
	ConditionDenseFreezingDrizzle
	ConditionSlightRain
	ConditionModerateRain
	ConditionHeavyRain
	ConditionLightFreezingRain
	ConditionHeavyFreezingRain
	ConditionSlightSnowFall
	ConditionModerateSnowFall
	ConditionHeavySnowFall
	ConditionSnowGrains
	ConditionSlightRainShowers
	ConditionModerateRainShowers
	ConditionViolentRainShowers
	ConditionSlightSnowShowers
	ConditionHeavySnowShowers
	ConditionThunderstorm
	ConditionThunderstormSlightHail
	ConditionThunderstormHeavyHail
	ConditionUnknown
)

var weatherCodeToCondition = map[int]WeatherCondition{
	0:  ConditionClearSky,
	1:  ConditionMainlyClear,
	2:  ConditionPartlyCloudy,
	3:  ConditionOvercast,
	45: ConditionFog,
	48: ConditionDepositingRimeFog,
	51: ConditionLightDrizzle,
	53: ConditionModerateDrizzle,
	55: ConditionDenseDrizzle,
	56: ConditionLightFreezingDrizzle,
	57: ConditionDenseFreezingDrizzle,
	61: ConditionSlightRain,
	63: ConditionModerateRain,
	65: ConditionHeavyRain,
	66: ConditionLightFreezingRain,
	67: ConditionHeavyFreezingRain,
	71: ConditionSlightSnowFall,
	73: ConditionModerateSnowFall,
	75: ConditionHeavySnowFall,
	77: ConditionSnowGrains,
	80: ConditionSlightRainShowers,
	81: ConditionModerateRainShowers,
	82: ConditionViolentRainShowers,
	85: ConditionSlightSnowShowers,
	86: ConditionHeavySnowShowers,
	95: ConditionThunderstorm,
	96: ConditionThunderstormSlightHail,
	99: ConditionThunderstormHeavyHail,
}

func ConditionFromWMOCode(code int) WeatherCondition {
	if condition, ok := weatherCodeToCondition[code]; ok {
		return condition
	}
	return ConditionUnknown
}

var conditionToString = map[WeatherCondition]string{
	ConditionClearSky:               "Clear sky",
	ConditionMainlyClear:            "Mainly clear",
	ConditionPartlyCloudy:           "Partly cloudy",
	ConditionOvercast:               "Overcast",
	ConditionFog:                    "Fog",
	ConditionDepositingRimeFog:      "Depositing rime fog",
	ConditionLightDrizzle:           "Light drizzle",
	ConditionModerateDrizzle:        "Moderate drizzle",
	ConditionDenseDrizzle:           "Dense drizzle",
	ConditionLightFreezingDrizzle:   "Light freezing drizzle",
	ConditionDenseFreezingDrizzle:   "Dense freezing drizzle",
	ConditionSlightRain:             "Slight rain",
	ConditionModerateRain:           "Moderate rain",
	ConditionHeavyRain:              "Heavy rain",
	ConditionLightFreezingRain:      "Light freezing rain",
	ConditionHeavyFreezingRain:      "Heavy freezing rain",
	ConditionSlightSnowFall:         "Slight snow fall",
	ConditionModerateSnowFall:       "Moderate snow fall",
	ConditionHeavySnowFall:          "Heavy snow fall",
	ConditionSnowGrains:             "Snow grains",
	ConditionSlightRainShowers:      "Slight rain showers",
	ConditionModerateRainShowers:    "Moderate rain showers",
	ConditionViolentRainShowers:     "Violent rain showers",
	ConditionSlightSnowShowers:      "Slight snow showers",
	ConditionHeavySnowShowers:       "Heavy snow showers",
	ConditionThunderstorm:           "Thunderstorm",
	ConditionThunderstormSlightHail: "Thunderstorm with slight hail",
	ConditionThunderstormHeavyHail:  "Thunderstorm with heavy hail",
	ConditionUnknown:                "Unknown",
}

func (c WeatherCondition) String() string {
	if str, ok := conditionToString[c]; ok {
		return str
	}
	return "Unknown"
}
