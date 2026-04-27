import { Request, Response } from "express";
import { AuthInboundPort } from "../application/ports/authInboundPort";

export class UserController {
  constructor(private service: AuthInboundPort) {}

  async login(req: Request, res: Response): Promise<void> {
    const { houseId, username } = req.body;
    try {
      const result = await this.service.login(houseId, username, "");
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: "Invalid credentials" });
    }
  }
}
