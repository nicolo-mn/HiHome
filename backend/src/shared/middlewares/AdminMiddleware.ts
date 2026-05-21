import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../../utils/JwtUtils";

type JwtPayload = {
  role?: string;
  [key: string]: unknown;
};

function getTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] ?? null;
}

export const adminMiddleware = (
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
    const decoded = verifyAuthToken(token) as JwtPayload;
    (req as any).user = decoded;
    if (decoded.role !== "Admin") {
      res.status(403).json({ error: "Forbidden: Admin access required" });
      return;
    }
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
