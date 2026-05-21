import { body, param } from "express-validator";
import { validate } from "../../../shared/middlewares/Validate";

export const sensorTemperatureValidator = [
  body("temperature")
    .notEmpty()
    .withMessage("temperature is required")
    .isNumeric()
    .withMessage("temperature must be a number")
    .isFloat({ min: 5, max: 40 })
    .withMessage("temperature must be between 5 and 40"),

  validate,
];

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
    .withMessage("temperature must be a number")
    .isFloat({ min: 5, max: 40 })
    .withMessage("temperature must be between 5 and 40"),

  body("temperature")
    .if((_value, { req }) => req.params?.action !== "setTemperature")
    .isEmpty()
    .withMessage(
      'temperature should only be provided when action is "setTemperature"',
    ),

  validate,
];
