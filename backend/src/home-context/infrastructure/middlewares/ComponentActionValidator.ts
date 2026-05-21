import { body, param } from "express-validator";
import { ComponentTypes } from "../../domain";
import { validate } from "../../../shared/middlewares/Validate";
import { HomeService } from "../../application/HomeService";

const COMMANDS_BY_TYPE: Record<string, string[]> = {
  light: ["turnOn", "turnOff"],
  window: ["open", "close"],
  thermostat: ["setTemperature"],
};

export const componentIdValidator = [
  param("componentId").notEmpty().withMessage("componentId is required"),
  validate,
];

export const temperatureValidator = [
  body("temperature")
    .if((_value, { req }) => req.params?.action === "setTemperature")
    .notEmpty()
    .withMessage("temperature is required when action is setTemperature")
    .isNumeric()
    .withMessage("temperature must be a number"),

  body("temperature")
    .if((_value, { req }) => req.params?.action !== "setTemperature")
    .isEmpty()
    .withMessage(
      'temperature should only be provided when action is "setTemperature"',
    ),

  validate,
];
