package domain

type WeatherType int

const (
	ClearDay WeatherType = iota
	PartlyCloudy
	Overcast
	Fog
	Drizzle
	Rain
	Snow
	Thunderstorm
	Unknown
)

var weatherCodeToWeatherType = map[int]WeatherType{
	0:  ClearDay,
	1:  ClearDay,
	2:  PartlyCloudy,
	3:  Overcast,
	45: Fog,
	48: Fog,
	51: Drizzle,
	53: Drizzle,
	55: Drizzle,
	56: Drizzle,
	57: Drizzle,
	61: Rain,
	63: Rain,
	65: Rain,
	66: Rain,
	67: Rain,
	71: Snow,
	73: Snow,
	75: Snow,
	77: Snow,
	80: Rain,
	81: Rain,
	82: Rain,
	85: Snow,
	86: Snow,
	95: Thunderstorm,
	96: Thunderstorm,
	99: Thunderstorm,
}

func FromWMOCode(code int) WeatherType {
	if weatherType, ok := weatherCodeToWeatherType[code]; ok {
		return weatherType
	}
	return Unknown
}
