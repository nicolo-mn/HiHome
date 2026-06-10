import { Request, Response } from "express";
import { AuthInboundPort } from "../../application/ports/AuthInboundPort";

export class UserController {
  constructor(private service: AuthInboundPort) {}

  async login(req: Request, res: Response): Promise<void> {
    const { homeId, username, password } = req.body;
    try {
      const result = await this.service.login(homeId, username, password);
      res.json({ token: result });
    } catch (error) {
      res.status(401).json({ error: "Invalid credentials" });
    }
  }
}
