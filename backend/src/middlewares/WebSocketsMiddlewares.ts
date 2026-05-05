import { Socket } from "socket.io";
import { verifyAuthToken } from "../utils/JwtUtils";

export const wsAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  const authHeader =
    socket.handshake.auth.token || socket.handshake.headers.authorization;

  if (!authHeader) {
    return next(new Error("Unauthorized: Missing token"));
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = verifyAuthToken(token);
    (socket as any).user = decoded;
    next();
  } catch (error) {
    next(new Error("Unauthorized: Invalid token"));
  }
};

export const wsHouseIdMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  const houseId = socket.handshake.query.houseId as string;

  if (!houseId) {
    return next(new Error("Bad Request: Missing houseId parameter"));
  }

  const user = (socket as any).user;
  if (!user || user.houseId !== houseId) {
    return next(new Error("Forbidden: Access to this house is denied"));
  }

  next();
};
