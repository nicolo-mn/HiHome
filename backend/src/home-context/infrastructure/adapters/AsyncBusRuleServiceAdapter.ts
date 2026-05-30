import EventEmitter from "events";
import { RuleServicePort } from "../../application/ports/RuleServicePort";
import {
  OutdoorSensorsUpdate,
  TemperatureState,
  WeatherForecast,
} from "../../domain";
import {
  ObservablesUpdatedDomainEvent,
  WeatherForecast as RuleWeatherForecast,
} from "../../../rule-context/domain/Observables";

// TODO: evaluate shared kernel usage here
export class AsyncBusRuleServiceAdapter implements RuleServicePort {
  constructor(
    private readonly eventEmitter: EventEmitter,
    private readonly eventName: string,
  ) {}

  evaluateRules(
    homeId: string,
    extSensorsData: OutdoorSensorsUpdate,
    indoorTemperature: TemperatureState,
  ): void {
    const event: ObservablesUpdatedDomainEvent = {
      outdoorTemperature: extSensorsData.outdoorTemperature.temperature,
      indoorTemperature: indoorTemperature.temperature,
      airQuality: extSensorsData.airQuality.AQI,
      windSpeed: extSensorsData.wind.windSpeed,
      weatherForecast: this.convertWeatherForecastToRuleContextFormat(
        extSensorsData.weather.forecast,
      ),
    };

    this.eventEmitter.emit(this.eventName, homeId, event);
  }

  private convertWeatherForecastToRuleContextFormat(
    weatherForecast: WeatherForecast,
  ): RuleWeatherForecast {
    return weatherForecast;
  }
}
