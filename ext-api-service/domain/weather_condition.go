package domain

type WeatherDescription int

const (
	ClearSky WeatherDescription = iota
	MainlyClear
	PartlyCloudy
	Overcast
	Fog
	DepositingRimeFog
	LightDrizzle
	ModerateDrizzle
	DenseDrizzle
	LightFreezingDrizzle
	DenseFreezingDrizzle
	SlightRain
	ModerateRain
	HeavyRain
	LightFreezingRain
	HeavyFreezingRain
	SlightSnowFall
	ModerateSnowFall
	HeavySnowFall
	SnowGrains
	SlightRainShowers
	ModerateRainShowers
	ViolentRainShowers
	SlightSnowShowers
	HeavySnowShowers
	Thunderstorm
	ThunderstormSlightHail
	ThunderstormHeavyHail
	Unknown
)

var weatherCodeToWeatherDescription = map[int]WeatherDescription{
	0:  ClearSky,
	1:  MainlyClear,
	2:  PartlyCloudy,
	3:  Overcast,
	45: Fog,
	48: DepositingRimeFog,
	51: LightDrizzle,
	53: ModerateDrizzle,
	55: DenseDrizzle,
	56: LightFreezingDrizzle,
	57: DenseFreezingDrizzle,
	61: SlightRain,
	63: ModerateRain,
	65: HeavyRain,
	66: LightFreezingRain,
	67: HeavyFreezingRain,
	71: SlightSnowFall,
	73: ModerateSnowFall,
	75: HeavySnowFall,
	77: SnowGrains,
	80: SlightRainShowers,
	81: ModerateRainShowers,
	82: ViolentRainShowers,
	85: SlightSnowShowers,
	86: HeavySnowShowers,
	95: Thunderstorm,
	96: ThunderstormSlightHail,
	99: ThunderstormHeavyHail,
}

func FromWMOCode(code int) WeatherDescription {
	if weatherDescription, ok := weatherCodeToWeatherDescription[code]; ok {
		return weatherDescription
	}
	return Unknown
}

var weatherDescriptionToString = map[WeatherDescription]string{
	ClearSky:               "Clear sky",
	MainlyClear:            "Mainly clear",
	PartlyCloudy:           "Partly cloudy",
	Overcast:               "Overcast",
	Fog:                    "Fog",
	DepositingRimeFog:      "Depositing rime fog",
	LightDrizzle:           "Light drizzle",
	ModerateDrizzle:        "Moderate drizzle",
	DenseDrizzle:           "Dense drizzle",
	LightFreezingDrizzle:   "Light freezing drizzle",
	DenseFreezingDrizzle:   "Dense freezing drizzle",
	SlightRain:             "Slight rain",
	ModerateRain:           "Moderate rain",
	HeavyRain:              "Heavy rain",
	LightFreezingRain:      "Light freezing rain",
	HeavyFreezingRain:      "Heavy freezing rain",
	SlightSnowFall:         "Slight snow fall",
	ModerateSnowFall:       "Moderate snow fall",
	HeavySnowFall:          "Heavy snow fall",
	SnowGrains:             "Snow grains",
	SlightRainShowers:      "Slight rain showers",
	ModerateRainShowers:    "Moderate rain showers",
	ViolentRainShowers:     "Violent rain showers",
	SlightSnowShowers:      "Slight snow showers",
	HeavySnowShowers:       "Heavy snow showers",
	Thunderstorm:           "Thunderstorm",
	ThunderstormSlightHail: "Thunderstorm with slight hail",
	ThunderstormHeavyHail:  "Thunderstorm with heavy hail",
	Unknown:                "Unknown",
}

func (c WeatherDescription) String() string {
	if str, ok := weatherDescriptionToString[c]; ok {
		return str
	}
	return "Unknown"
}
