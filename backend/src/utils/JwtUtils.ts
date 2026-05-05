import jwt from "jsonwebtoken";

export const verifyAuthToken = (token: string) => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret);
};
