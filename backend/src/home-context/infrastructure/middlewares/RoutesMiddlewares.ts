import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../../../utils/JwtUtils";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAuthToken(token);
    // Attach decoded user info to request object
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const homeIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const homeId = req.params.id;
  if (!homeId) {
    res.status(400).json({ error: "Bad Request: Missing homeId parameter" });
    return;
  }

  const user = (req as any).user;
  if (!user || user.homeId !== homeId) {
    res
      .status(403)
      .json({ error: "Forbidden: Access to this house is denied" });
    return;
  }

  next();
};
