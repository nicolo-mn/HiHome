import { describe, it, expect } from "vitest";
import { getHourInRome } from "./dateUtils";

describe("dateUtils", () => {
  describe("getHourInRome", () => {
    it("should return the correct hour in Rome timezone (UTC+1 in winter)", () => {
      // 2026-01-01T12:00:00Z -> 13:00:00 in Rome (UTC+1)
      const date = new Date("2026-01-01T12:00:00Z");
      expect(getHourInRome(date)).toBe(13);
    });

    it("should return the correct hour in Rome timezone (UTC+2 in summer)", () => {
      // 2026-06-08T12:00:00Z -> 14:00:00 in Rome (UTC+2)
      const date = new Date("2026-06-08T12:00:00Z");
      expect(getHourInRome(date)).toBe(14);
    });

    it("should handle midnight (00:00) correctly", () => {
      // 2026-06-08T22:00:00Z -> 00:00:00 next day in Rome (UTC+2)
      const date = new Date("2026-06-08T22:00:00Z");
      expect(getHourInRome(date)).toBe(0);
    });
  });
});
