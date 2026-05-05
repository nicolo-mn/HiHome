import { Request, Response } from "express";
import { ChatService } from "../application/ChatService";

type AuthedUser = {
  houseId: string;
  username: string;
};

export class ChatController {
  constructor(private chatService: ChatService) {}

  async chat(req: Request, res: Response) {
    const { message } = req.body as { message?: string };
    const user = (req as any).user as AuthedUser | undefined;

    if (!user?.houseId || !user.username) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    try {
      const reply = await this.chatService.chat(
        user.houseId,
        user.username,
        message,
      );
      res.json({ reply });
    } catch (error: any) {
      res.status(500).json({ error: error.message ?? "Chat failed" });
    }
  }
}
