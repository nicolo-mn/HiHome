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

var weatherDescriptionToIcon = map[domain.WeatherDescription]weatherIcon{
	domain.ClearSky:               iconClearDay,
	domain.MainlyClear:            iconClearDay,
	domain.PartlyCloudy:           iconPartlyCloudy,
	domain.Overcast:               iconOvercast,
	domain.Fog:                    iconFog,
	domain.DepositingRimeFog:      iconFog,
	domain.LightDrizzle:           iconDrizzle,
	domain.ModerateDrizzle:        iconDrizzle,
	domain.DenseDrizzle:           iconDrizzle,
	domain.LightFreezingDrizzle:   iconDrizzle,
	domain.DenseFreezingDrizzle:   iconDrizzle,
	domain.SlightRain:             iconRain,
	domain.ModerateRain:           iconRain,
	domain.HeavyRain:              iconRain,
	domain.LightFreezingRain:      iconRain,
	domain.HeavyFreezingRain:      iconRain,
	domain.SlightRainShowers:      iconRain,
	domain.ModerateRainShowers:    iconRain,
	domain.ViolentRainShowers:     iconRain,
	domain.SlightSnowFall:         iconSnow,
	domain.ModerateSnowFall:       iconSnow,
	domain.HeavySnowFall:          iconSnow,
	domain.SnowGrains:             iconSnow,
	domain.SlightSnowShowers:      iconSnow,
	domain.HeavySnowShowers:       iconSnow,
	domain.Thunderstorm:           iconThunderstorm,
	domain.ThunderstormSlightHail: iconThunderstorm,
	domain.ThunderstormHeavyHail:  iconThunderstorm,
}
