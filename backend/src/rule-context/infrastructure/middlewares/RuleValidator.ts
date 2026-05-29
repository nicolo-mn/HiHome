import { body, param } from "express-validator";
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

export const conditionValidator = [
  body("observableId")
    .notEmpty()
    .withMessage("observableId is required")
    .isIn([
      "internal-thermometer",
      "external-thermometer",
      "wind-speed",
      "weather",
      "air-quality",
    ])
    .withMessage(
      "observableId must be one of: internal-thermometer, external-thermometer, wind-speed, weather, air-quality",
    ),

  body("operator")
    .notEmpty()
    .withMessage("operator is required")
    .bail()
    .if((_value, { req }) =>
      [
        "internal-thermometer",
        "external-thermometer",
        "wind-speed",
        "air-quality",
      ].includes(req.body?.observableId),
    )
    .isIn(["gt", "lt", "eq"])
    .withMessage("operator must be one of: gt, lt, eq for this observable")
    .if((_value, { req }) => req.body?.observableId === "weather")
    .isIn(["is"])
    .withMessage('operator must be "is" for weather observable'),

  body("operatorTarget")
    .notEmpty()
    .withMessage("operatorTarget is required")
    .bail()
    .if((_value, { req }) =>
      [
        "internal-thermometer",
        "external-thermometer",
        "wind-speed",
        "air-quality",
      ].includes(req.body?.observableId),
    )
    .isNumeric()
    .withMessage("operatorTarget must be a number for this observable")
    .if((_value, { req }) => req.body?.observableId === "weather")
    .isIn([
      "clear",
      "drizzle",
      "fog",
      "overcast",
      "rain",
      "snow",
      "thunderstorm",
    ])
    .withMessage(
      "operatorTarget must be one of: clear, drizzle, fog, overcast, rain, snow, thunderstorm for weather observable",
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
    .withMessage("targetTemp must be between 5 and 40")
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
