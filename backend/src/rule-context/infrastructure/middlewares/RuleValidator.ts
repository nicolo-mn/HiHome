import { body, param, CustomValidator } from "express-validator";
import { validate } from "../../../shared/middlewares/Validate";

const DEVICE_TYPES = ["light", "window", "thermostat", "lock", "fan"] as const;

const COMMANDS_BY_TYPE: Record<string, string[]> = {
  light: ["turnOn", "turnOff"],
  window: ["open", "close"],
  thermostat: ["setTemperature"],
  lock: ["lock", "unlock"],
  fan: ["setOff", "setLow", "setMedium", "setHigh"],
};

export const namingAndOwnershipValidator = [
  param("id")
    .notEmpty()
    .withMessage("id must be present")
    .isInt()
    .withMessage("id must be a number"),

  body("ruleName").notEmpty().withMessage("ruleName must be present"),

  validate,
];

const OBSERVABLE_IDS = [
  "indoor-thermometer",
  "outdoor-thermometer",
  "wind-speed",
  "weather",
  "air-quality",
];
const NUMERIC_OBSERVABLES = [
  "indoor-thermometer",
  "outdoor-thermometer",
  "wind-speed",
  "air-quality",
];
const WEATHER_TARGETS = [
  "clear",
  "cloudy",
  "drizzle",
  "fog",
  "overcast",
  "rain",
  "snow",
  "thunderstorm",
];

const isNumericObservable: CustomValidator = (_value, { req }) =>
  NUMERIC_OBSERVABLES.includes(req.body?.observableId);
const isWeatherObservable: CustomValidator = (_value, { req }) =>
  req.body?.observableId === "weather";

export const conditionValidator = [
  body("observableId")
    .notEmpty()
    .withMessage("observableId is required")
    .isIn(OBSERVABLE_IDS)
    .withMessage(
      "observableId must be one of: indoor-thermometer, outdoor-thermometer, wind-speed, weather, air-quality",
    ),

  body("operator").notEmpty().withMessage("operator is required"),

  // Separate chains per observable family: chaining both `.if()` on a single
  // chain would short-circuit the second branch (express-validator stops the
  // chain on the first false condition), leaving the weather rules unenforced.
  body("operator")
    .if(isNumericObservable)
    .isIn(["gt", "lt", "eq"])
    .withMessage("operator must be one of: gt, lt, eq for this observable"),

  body("operator")
    .if(isWeatherObservable)
    .isIn(["is"])
    .withMessage('operator must be "is" for weather observable'),

  body("operatorTarget").notEmpty().withMessage("operatorTarget is required"),

  body("operatorTarget")
    .if(isNumericObservable)
    .isNumeric()
    .withMessage("operatorTarget must be a number for this observable"),

  body("operatorTarget")
    .if(isWeatherObservable)
    .isIn(WEATHER_TARGETS)
    .withMessage(
      "operatorTarget must be one of: clear, cloudy, drizzle, fog, overcast, rain, snow, thunderstorm for weather observable",
    ),

  validate,
];

const getActionIndex = (path: string) => parseInt(path.split("[")[1], 10);

export const actionsValidator = [
  body("actions")
    .isArray({ min: 1 })
    .withMessage("actions must be a non-empty array"),

  body("actions[*].deviceId").notEmpty().withMessage("deviceId is required"),

  body("actions[*].deviceType")
    .notEmpty()
    .withMessage("deviceType is required")
    .isIn(DEVICE_TYPES)
    .withMessage(`deviceType must be one of: ${DEVICE_TYPES.join(", ")}`),

  body("actions[*].command")
    .notEmpty()
    .withMessage("command is required")
    .bail()
    .custom((value, { req, path }) => {
      const index = getActionIndex(path);
      const deviceType = req.body?.actions?.[index]?.deviceType;
      const validCommands = COMMANDS_BY_TYPE[deviceType];
      if (!validCommands) return true;
      if (!validCommands.includes(value)) {
        throw new Error(
          `command must be one of: ${validCommands.join(", ")} for ${deviceType}`,
        );
      }
      return true;
    }),

  body("actions[*].targetTemp")
    .if((_value, { req, path }) => {
      const index = getActionIndex(path);
      return req.body?.actions?.[index]?.command === "setTemperature";
    })
    .notEmpty()
    .withMessage("targetTemp is required when command is setTemperature")
    .isNumeric()
    .withMessage("targetTemp must be a number")
    .isFloat({ min: 5, max: 40 })
    .withMessage("targetTemp must be between 5 and 40"),

  // Separate chain so this branch runs (a single chain would stop at the first
  // `.if()` above, leaving the "only for setTemperature" rule unenforced).
  body("actions[*].targetTemp")
    .if((_value, { req, path }) => {
      const index = getActionIndex(path);
      return req.body?.actions?.[index]?.command !== "setTemperature";
    })
    .isEmpty()
    .withMessage(
      'targetTemp should only be provided when command is "setTemperature"',
    ),

  validate,
];

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const timeWindowValidator = [
  body("timeWindow")
    .optional()
    .isObject()
    .withMessage("timeWindow must be an object"),

  body("timeWindow.days")
    .optional()
    .isArray()
    .withMessage("timeWindow.days must be an array")
    .bail()
    .custom((days: unknown[]) => {
      if (
        !days.every(
          (d) =>
            typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6,
        )
      ) {
        throw new Error("timeWindow.days must be integers between 0 and 6");
      }
      if (new Set(days).size !== days.length) {
        throw new Error("timeWindow.days must not contain duplicates");
      }
      return true;
    }),

  body("timeWindow.start")
    .optional()
    .matches(HHMM_REGEX)
    .withMessage("timeWindow.start must be a valid HH:MM time"),

  body("timeWindow.end")
    .optional()
    .matches(HHMM_REGEX)
    .withMessage("timeWindow.end must be a valid HH:MM time"),

  validate,
];

export const reorderValidator = [
  body("ruleIds")
    .isArray({ min: 1 })
    .withMessage("ruleIds must be a non-empty array")
    .bail()
    .custom((ids: unknown[]) => {
      if (!ids.every((id) => typeof id === "string" && id.length > 0)) {
        throw new Error("ruleIds must be an array of non-empty strings");
      }
      if (new Set(ids).size !== ids.length) {
        throw new Error("ruleIds must not contain duplicates");
      }
      return true;
    }),

  validate,
];
