import { Request, Response } from "express";
import { ChatService, type ChatMessage } from "../../application/ChatService";

type AuthedUser = {
  homeId: string;
  username: string;
};

export class ChatController {
  constructor(private chatService: ChatService) {}

  async chat(req: Request, res: Response) {
    const { message, history } = req.body as {
      message?: string;
      history?: ChatMessage[];
    };
    const user = (req as any).user as AuthedUser | undefined;

    if (!user?.homeId || !user.username) {
      console.warn(
        "ChatController: Unauthorized request, user not authenticated properly",
      );
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!message) {
      console.warn("ChatController: Missing message in request body");
      res.status(400).json({ error: "Message is required" });
      return;
    }

    try {
      console.log(
        `ChatController: Chat requested for home ${user.homeId} by user ${user.username}`,
      );
      const safeHistory = Array.isArray(history) ? history : [];
      const reply = await this.chatService.chat(
        user.homeId,
        user.username,
        message,
        safeHistory,
      );
      console.log(
        `ChatController: Successfully generated reply for home ${user.homeId}`,
      );
      res.json({ reply });
    } catch (error: any) {
      res.status(500).json({ error: error.message ?? "Chat failed" });
    }
  }
}
