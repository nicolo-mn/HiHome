import { header, query, validationResult } from "express-validator";
import { Socket } from "socket.io";
import { verifyAuthToken } from "../../../utils/JwtUtils";

type SocketRequest = {
  headers: { authorization?: string };
  query: { homeId?: string };
  user?: { homeId?: string; [key: string]: unknown } | string;
};

const wsAuthValidators = [
  header("authorization").custom((value, { req }) => {
    if (!value) {
      throw new Error("Unauthorized: Missing token");
    }

    const token = value.startsWith("Bearer ") ? value.split(" ")[1] : value;
    try {
      const decoded = verifyAuthToken(token);
      (req as SocketRequest).user = decoded;
      return true;
    } catch (error) {
      throw new Error("Unauthorized: Invalid token");
    }
  }),
];

const wsHomeIdValidators = [
  query("homeId").custom((value, { req }) => {
    const homeId = value as string | undefined;
    if (!homeId) {
      throw new Error("Bad Request: Missing homeId parameter");
    }

    const user = (req as SocketRequest).user as { homeId?: string } | undefined;
    if (!user || user.homeId !== homeId) {
      throw new Error("Forbidden: Access to this home is denied");
    }

    return true;
  }),
];

function getValidationMessage(req: SocketRequest): string | null {
  const errors = validationResult(req as any).array({ onlyFirstError: true });
  if (errors.length === 0) return null;
  return typeof errors[0]?.msg === "string" ? errors[0].msg : null;
}

export const wsAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  const authHeader =
    socket.handshake.auth.token || socket.handshake.headers.authorization;
  const req: SocketRequest = {
    headers: { authorization: authHeader },
    query: {},
  };

  await Promise.all(wsAuthValidators.map((validator) => validator.run(req)));
  const message = getValidationMessage(req);
  if (message) return next(new Error(message));

  (socket as any).user = req.user;
  next();
};

export const wsHomeIdMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  const req: SocketRequest = {
    headers: {},
    query: { homeId: socket.handshake.query.homeId as string },
    user: (socket as any).user,
  };

  await Promise.all(wsHomeIdValidators.map((validator) => validator.run(req)));
  const message = getValidationMessage(req);
  if (message) return next(new Error(message));

  next();
};
