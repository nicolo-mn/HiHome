import { Request, Response, NextFunction } from "express";
import { validationResult, FieldValidationError } from "express-validator";

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req).array({
    onlyFirstError: true,
  }) as FieldValidationError[];

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors: errors.map((err) => ({
        message: `${err.path} ${err.msg}`,
      })),
    });
  }
  next();
};
