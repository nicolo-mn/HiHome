import { Request, Response, NextFunction } from "express";
import { header, param, validationResult } from "express-validator";
import { verifyAuthToken } from "../../../utils/JwtUtils";

const authValidators = [
  header("authorization").custom((value, { req }) => {
    if (typeof value !== "string" || !value.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Missing or invalid token");
    }

    const token = value.split(" ")[1];
    try {
      const decoded = verifyAuthToken(token);
      (req as any).user = decoded;
      return true;
    } catch (error) {
      throw new Error("Unauthorized: Invalid token");
    }
  }),
];

const homeIdValidators = [
  param("id").custom((value, { req }) => {
    if (!value) {
      throw new Error("Bad Request: Missing homeId parameter");
    }

    const user = (req as any).user;
    if (!user || user.homeId !== value) {
      throw new Error("Forbidden: Access to this house is denied");
    }

    return true;
  }),
];

function getValidationMessage(req: Request): string | null {
  const errors = validationResult(req).array({ onlyFirstError: true });
  if (errors.length === 0) return null;
  return typeof errors[0]?.msg === "string" ? errors[0].msg : null;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await Promise.all(authValidators.map((validator) => validator.run(req)));
  const message = getValidationMessage(req);
  if (message) {
    res.status(401).json({ error: message });
    return;
  }
  next();
};

export const homeIdMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await Promise.all(homeIdValidators.map((validator) => validator.run(req)));
  const message = getValidationMessage(req);
  if (message) {
    const status = message.startsWith("Forbidden:") ? 403 : 400;
    res.status(status).json({ error: message });
    return;
  }
  next();
};
