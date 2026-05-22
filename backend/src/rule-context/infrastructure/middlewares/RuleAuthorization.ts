import { Request, Response, NextFunction } from "express";
import {
  AuthenticatedRequest,
  authenticationMiddleware,
} from "../../../shared/middlewares/AuthenticationMiddleware";
import { Role } from "../../../user-context/domain/Entities";

const requireRole = (...allowed: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    authenticationMiddleware(req, res, () => {
      const role = (req as AuthenticatedRequest).user?.role;
      if (!role || !(allowed as string[]).includes(role)) {
        res
          .status(403)
          .json({ error: "Forbidden: insufficient rule privileges" });
        return;
      }
      next();
    });
  };
};

export const canManageRules = requireRole(Role.Admin);
