import { describe, it, expect, vi } from "vitest";
import {
  NumericEqualityOperator,
  NumericGreaterOperator,
  NumericLowerOperator,
  WeatherEqualityOperator,
  WeatherCondition,
  OutdoorTemperatureCondition,
  IndoorTemperatureCondition,
  AirQualityCondition,
  WindSpeedCondition,
  WeatherForecast,
  ObservablesUpdatedDomainEvent,
  BoundaryViolationError,
} from "./Observables";

describe("Operators", () => {
  describe("NumericEqualityOperator", () => {
    it("should evaluate equality correctly", () => {
      const op = new NumericEqualityOperator(5);
      expect(op.evaluate(5)).toBe(true);
      expect(op.evaluate(4)).toBe(false);
      expect(op.getBoundaryValue()).toBe(5);
    });
  });

  describe("NumericGreaterOperator", () => {
    it("should evaluate greater than correctly", () => {
      const op = new NumericGreaterOperator(5);
      expect(op.evaluate(6)).toBe(true);
      expect(op.evaluate(5)).toBe(false);
      expect(op.getBoundaryValue()).toBe(5);
    });
  });

  describe("NumericLowerOperator", () => {
    it("should evaluate lower than correctly", () => {
      const op = new NumericLowerOperator(5);
      expect(op.evaluate(4)).toBe(true);
      expect(op.evaluate(5)).toBe(false);
      expect(op.getBoundaryValue()).toBe(5);
    });
  });

  describe("WeatherEqualityOperator", () => {
    it("should evaluate weather equality correctly", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      expect(op.evaluate(WeatherForecast.Rain)).toBe(true);
      expect(op.evaluate(WeatherForecast.Clear)).toBe(false);
      expect(op.getBoundaryValue()).toBe(WeatherForecast.Rain);
    });
  });
});

describe("Conditions", () => {
  const baseUpdate: ObservablesUpdatedDomainEvent = {
    outdoorTemperature: 20,
    indoorTemperature: 22,
    airQuality: 50,
    windSpeed: 10,
    weatherForecast: WeatherForecast.Clear,
  };

  describe("WeatherCondition", () => {
    it("should return true on first verification if condition is met", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      const cond = new WeatherCondition(op);

      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(true);
    });

    it("should return true when condition remains true in consecutive updates", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      const cond = new WeatherCondition(op);

      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(true);
      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(true);
    });

    it("should return values based on the current weather", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      const cond = new WeatherCondition(op);

      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Clear }),
      ).toBe(false);
      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(true);
    });

    it("should accept visitor", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      const cond = new WeatherCondition(op);
      const mockVisitor = {
        visitWeatherCondition: vi.fn().mockReturnValue("weather"),
        visitOutdoorTemperatureCondition: vi.fn(),
        visitIndoorTemperatureCondition: vi.fn(),
        visitAirQualityCondition: vi.fn(),
        visitWindSpeedCondition: vi.fn(),
      };

      expect(cond.accept(mockVisitor)).toBe("weather");
      expect(mockVisitor.visitWeatherCondition).toHaveBeenCalledWith(cond);
    });
  });

  describe("BoundedNumericConditions", () => {
    describe("OutdoorTemperatureCondition", () => {
      it("should verify outdoor temperature against the threshold", () => {
        const op = new NumericGreaterOperator(25);
        const cond = new OutdoorTemperatureCondition(op);

        expect(cond.verify({ ...baseUpdate, outdoorTemperature: 30 })).toBe(
          true,
        );
        expect(cond.verify({ ...baseUpdate, outdoorTemperature: 30 })).toBe(
          true,
        );
        expect(cond.verify({ ...baseUpdate, outdoorTemperature: 20 })).toBe(
          false,
        );
        expect(cond.verify({ ...baseUpdate, outdoorTemperature: 30 })).toBe(
          true,
        );
      });

      it("should throw BoundaryViolationError when boundary value is out of range on creation", () => {
        const op = new NumericGreaterOperator(100);
        expect(() => new OutdoorTemperatureCondition(op)).toThrow(
          BoundaryViolationError,
        );
      });

      it("should throw BoundaryViolationError when verified value is out of range", () => {
        const op = new NumericGreaterOperator(25);
        const cond = new OutdoorTemperatureCondition(op);

        expect(() =>
          cond.verify({ ...baseUpdate, outdoorTemperature: 100 }),
        ).toThrow(BoundaryViolationError);
      });

      it("should accept visitor", () => {
        const op = new NumericGreaterOperator(25);
        const cond = new OutdoorTemperatureCondition(op);
        const mockVisitor = {
          visitWeatherCondition: vi.fn(),
          visitOutdoorTemperatureCondition: vi.fn().mockReturnValue("outdoor"),
          visitIndoorTemperatureCondition: vi.fn(),
          visitAirQualityCondition: vi.fn(),
          visitWindSpeedCondition: vi.fn(),
        };

        expect(cond.accept(mockVisitor)).toBe("outdoor");
        expect(
          mockVisitor.visitOutdoorTemperatureCondition,
        ).toHaveBeenCalledWith(cond);
      });
    });

    describe("IndoorTemperatureCondition", () => {
      it("should verify indoor temperature against the threshold", () => {
        const op = new NumericLowerOperator(20);
        const cond = new IndoorTemperatureCondition(op);

        expect(cond.verify({ ...baseUpdate, indoorTemperature: 15 })).toBe(
          true,
        );
        expect(cond.verify({ ...baseUpdate, indoorTemperature: 18 })).toBe(
          true,
        );
      });

      it("should throw BoundaryViolationError when boundary value is out of range on creation", () => {
        const op = new NumericGreaterOperator(100);
        expect(() => new IndoorTemperatureCondition(op)).toThrow(
          BoundaryViolationError,
        );
      });

      it("should accept visitor", () => {
        const op = new NumericLowerOperator(20);
        const cond = new IndoorTemperatureCondition(op);
        const mockVisitor = {
          visitWeatherCondition: vi.fn(),
          visitOutdoorTemperatureCondition: vi.fn(),
          visitIndoorTemperatureCondition: vi.fn().mockReturnValue("indoor"),
          visitAirQualityCondition: vi.fn(),
          visitWindSpeedCondition: vi.fn(),
        };

        expect(cond.accept(mockVisitor)).toBe("indoor");
        expect(
          mockVisitor.visitIndoorTemperatureCondition,
        ).toHaveBeenCalledWith(cond);
      });
    });

    describe("AirQualityCondition", () => {
      it("should verify air quality against the threshold", () => {
        const op = new NumericGreaterOperator(100);
        const cond = new AirQualityCondition(op);

        expect(cond.verify({ ...baseUpdate, airQuality: 120 })).toBe(true);
        expect(cond.verify({ ...baseUpdate, airQuality: 80 })).toBe(false);
      });

      it("should throw BoundaryViolationError when boundary value is out of range on creation", () => {
        const op = new NumericGreaterOperator(200);
        expect(() => new AirQualityCondition(op)).toThrow(
          BoundaryViolationError,
        );
      });

      it("should accept visitor", () => {
        const op = new NumericGreaterOperator(100);
        const cond = new AirQualityCondition(op);
        const mockVisitor = {
          visitWeatherCondition: vi.fn(),
          visitOutdoorTemperatureCondition: vi.fn(),
          visitIndoorTemperatureCondition: vi.fn(),
          visitAirQualityCondition: vi.fn().mockReturnValue("aqi"),
          visitWindSpeedCondition: vi.fn(),
        };

        expect(cond.accept(mockVisitor)).toBe("aqi");
        expect(mockVisitor.visitAirQualityCondition).toHaveBeenCalledWith(cond);
      });
    });

    describe("WindSpeedCondition", () => {
      it("should verify wind speed against the threshold", () => {
        const op = new NumericGreaterOperator(15);
        const cond = new WindSpeedCondition(op);

        expect(cond.verify({ ...baseUpdate, windSpeed: 20 })).toBe(true);
        expect(cond.verify({ ...baseUpdate, windSpeed: 20 })).toBe(true);
        expect(cond.verify({ ...baseUpdate, windSpeed: 10 })).toBe(false);
        expect(cond.verify({ ...baseUpdate, windSpeed: 20 })).toBe(true);
      });

      it("should throw BoundaryViolationError when boundary value is out of range on creation", () => {
        const op = new NumericGreaterOperator(100);
        expect(() => new WindSpeedCondition(op)).toThrow(
          BoundaryViolationError,
        );
      });

      it("should accept visitor", () => {
        const op = new NumericGreaterOperator(15);
        const cond = new WindSpeedCondition(op);
        const mockVisitor = {
          visitWeatherCondition: vi.fn(),
          visitOutdoorTemperatureCondition: vi.fn(),
          visitIndoorTemperatureCondition: vi.fn(),
          visitAirQualityCondition: vi.fn(),
          visitWindSpeedCondition: vi.fn().mockReturnValue("wind"),
        };

        expect(cond.accept(mockVisitor)).toBe("wind");
        expect(mockVisitor.visitWindSpeedCondition).toHaveBeenCalledWith(cond);
      });
    });
  });
});
