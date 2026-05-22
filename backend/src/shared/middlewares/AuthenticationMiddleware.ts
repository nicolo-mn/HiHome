import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../../utils/JwtUtils";

export type AuthenticatedUser = {
  username?: string;
  homeId?: string;
  role?: string;
  [key: string]: unknown;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

function getTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] ?? null;
}

export const authenticationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
    return;
  }

  try {
    const decoded = verifyAuthToken(token) as AuthenticatedUser;
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
