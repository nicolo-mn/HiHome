import { body, param } from "express-validator";
import { validate } from "./Validate";

const COMPONENT_TYPES = ["light", "window", "thermostat"] as const;

const COMMANDS_BY_TYPE: Record<string, string[]> = {
  light: ["turnOn", "turnOff"],
  window: ["open", "close"],
  thermostat: ["setTemperature"],
};

export const namingAndOwnershipValidator = [
  param("homeId")
    .notEmpty()
    .withMessage("homeId must be present")
    .isInt()
    .withMessage("homeId must be a number"),

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
      "weather",
      "air-quality",
    ])
    .withMessage(
      "observableId must be one of: internal-thermometer, external-thermometer, weather, air-quality",
    ),

  body("operator")
    .notEmpty()
    .withMessage("operator is required")
    .bail()
    .if((_value, { req }) =>
      ["internal-thermometer", "external-thermometer", "air-quality"].includes(
        req.body?.observableId,
      ),
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
      ["internal-thermometer", "external-thermometer", "air-quality"].includes(
        req.body?.observableId,
      ),
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

// Get the index of an action to access other fields
const getActionIndex = (path: string) => parseInt(path.split("[")[1], 10);

export const actionsValidator = [
  body("actions")
    .isArray({ min: 1 })
    .withMessage("actions must be a non-empty array"),

  body("actions[*].componentId")
    .notEmpty()
    .withMessage("componentId is required"),

  body("actions[*].componentType")
    .notEmpty()
    .withMessage("componentType is required")
    .isIn(COMPONENT_TYPES)
    .withMessage(`componentType must be one of: ${COMPONENT_TYPES.join(", ")}`),

  body("actions[*].command")
    .notEmpty()
    .withMessage("command is required")
    .bail()
    .if((_value, { req, path }) => {
      const index = getActionIndex(path);
      return req.body?.actions?.[index]?.componentType === "light";
    })
    .isIn(["turnOn", "turnOff"])
    .withMessage("command must be one of: turnOn, turnOff for light")
    .if((_value, { req, path }) => {
      const index = getActionIndex(path);
      return req.body?.actions?.[index]?.componentType === "window";
    })
    .isIn(["open", "close"])
    .withMessage("command must be one of: open, close for window")
    .if((_value, { req, path }) => {
      const index = getActionIndex(path);
      return req.body?.actions?.[index]?.componentType === "thermostat";
    })
    .isIn(["setTemperature"])
    .withMessage('command must be "setTemperature" for thermostat'),

  body("actions[*].targetTemp")
    .if((_value, { req, path }) => {
      const index = getActionIndex(path);
      return req.body?.actions?.[index]?.command === "setTemperature";
    })
    .notEmpty()
    .withMessage("targetTemp is required when command is setTemperature")
    .isNumeric()
    .withMessage("targetTemp must be a number")
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
