import { Router, Request, Response } from "express";
import { LoginService } from "../application/login-service";

export function createUserRoutes(loginService: LoginService): Router {
  const router = Router();

  router.post("/login", async (req: Request, res: Response) => {
    const { username, homeId } = req.body;

    if (!username || !homeId) {
      res.status(400).json({ error: "Both username and homeId are required" });
      return;
    }

    const result = await loginService.login(username, homeId);

    if ("error" in result) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({ token: result.token });
  });

  return router;
}
