import { describe, it, expect, vi } from "vitest";
import {
  NumericEqualityOperator,
  NumericGreaterOperator,
  NumericLowerOperator,
  WeatherEqualityOperator,
  WeatherCondition,
  ExternalTemperatureCondition,
  InternalTemperatureCondition,
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
    externalTemperature: 20,
    internalTemperature: 22,
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

    it("should track state change and return false if condition remains true in consecutive updates", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      const cond = new WeatherCondition(op);

      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(true);
      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(false);
    });

    it("should track state change and return true again when state flips to false then true", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      const cond = new WeatherCondition(op);

      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(true); // state: true
      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Clear }),
      ).toBe(false); // state: false
      expect(
        cond.verify({ ...baseUpdate, weatherForecast: WeatherForecast.Rain }),
      ).toBe(true); // state: true again
    });

    it("should accept visitor", () => {
      const op = new WeatherEqualityOperator(WeatherForecast.Rain);
      const cond = new WeatherCondition(op);
      const mockVisitor = {
        visitWeatherCondition: vi.fn().mockReturnValue("weather"),
        visitTemperatureCondition: vi.fn(),
        visitAirQualityCondition: vi.fn(),
        visitWindSpeedCondition: vi.fn(),
      };

      expect(cond.accept(mockVisitor)).toBe("weather");
      expect(mockVisitor.visitWeatherCondition).toHaveBeenCalledWith(cond);
    });
  });

  describe("BoundedNumericConditions", () => {
    describe("ExternalTemperatureCondition", () => {
      it("should verify external temperature and track state changes", () => {
        const op = new NumericGreaterOperator(25);
        const cond = new ExternalTemperatureCondition(op);

        expect(cond.verify({ ...baseUpdate, externalTemperature: 30 })).toBe(
          true,
        );
        expect(cond.verify({ ...baseUpdate, externalTemperature: 30 })).toBe(
          false,
        );
        expect(cond.verify({ ...baseUpdate, externalTemperature: 20 })).toBe(
          false,
        );
        expect(cond.verify({ ...baseUpdate, externalTemperature: 30 })).toBe(
          true,
        );
      });

      it("should throw BoundaryViolationError when boundary value is out of range on creation", () => {
        const op = new NumericGreaterOperator(100);
        expect(() => new ExternalTemperatureCondition(op)).toThrow(
          BoundaryViolationError,
        );
      });

      it("should throw BoundaryViolationError when verified value is out of range", () => {
        const op = new NumericGreaterOperator(25);
        const cond = new ExternalTemperatureCondition(op);

        expect(() =>
          cond.verify({ ...baseUpdate, externalTemperature: 100 }),
        ).toThrow(BoundaryViolationError);
      });

      it("should accept visitor", () => {
        const op = new NumericGreaterOperator(25);
        const cond = new ExternalTemperatureCondition(op);
        const mockVisitor = {
          visitWeatherCondition: vi.fn(),
          visitTemperatureCondition: vi.fn().mockReturnValue("temp"),
          visitAirQualityCondition: vi.fn(),
          visitWindSpeedCondition: vi.fn(),
        };

        expect(cond.accept(mockVisitor)).toBe("temp");
        expect(mockVisitor.visitTemperatureCondition).toHaveBeenCalledWith(
          cond,
        );
      });
    });

    describe("InternalTemperatureCondition", () => {
      it("should verify internal temperature and track state changes", () => {
        const op = new NumericLowerOperator(20);
        const cond = new InternalTemperatureCondition(op);

        expect(cond.verify({ ...baseUpdate, internalTemperature: 15 })).toBe(
          true,
        );
        expect(cond.verify({ ...baseUpdate, internalTemperature: 18 })).toBe(
          false,
        );
      });

      it("should throw BoundaryViolationError when boundary value is out of range on creation", () => {
        const op = new NumericGreaterOperator(100);
        expect(() => new InternalTemperatureCondition(op)).toThrow(
          BoundaryViolationError,
        );
      });
    });

    describe("AirQualityCondition", () => {
      it("should verify air quality and track state changes", () => {
        const op = new NumericGreaterOperator(100);
        const cond = new AirQualityCondition(op);

        expect(cond.verify({ ...baseUpdate, airQuality: 120 })).toBe(true);
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
          visitTemperatureCondition: vi.fn(),
          visitAirQualityCondition: vi.fn().mockReturnValue("aqi"),
          visitWindSpeedCondition: vi.fn(),
        };

        expect(cond.accept(mockVisitor)).toBe("aqi");
        expect(mockVisitor.visitAirQualityCondition).toHaveBeenCalledWith(cond);
      });
    });

    describe("WindSpeedCondition", () => {
      it("should verify wind speed and track state changes", () => {
        const op = new NumericGreaterOperator(15);
        const cond = new WindSpeedCondition(op);

        expect(cond.verify({ ...baseUpdate, windSpeed: 20 })).toBe(true);
        expect(cond.verify({ ...baseUpdate, windSpeed: 20 })).toBe(false);
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
          visitTemperatureCondition: vi.fn(),
          visitAirQualityCondition: vi.fn(),
          visitWindSpeedCondition: vi.fn().mockReturnValue("wind"),
        };

        expect(cond.accept(mockVisitor)).toBe("wind");
        expect(mockVisitor.visitWindSpeedCondition).toHaveBeenCalledWith(cond);
      });
    });
  });
});
