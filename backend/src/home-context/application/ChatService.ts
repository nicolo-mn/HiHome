import type { ChatCompletionPort } from "./ChatCompletionPort";
import type { ChatStreamPort } from "./ChatStreamPort";
import { HomeService } from "./HomeService";

type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatServiceOptions = {
  maxHistory: number;
  model: string;
};

export class ChatService {
  constructor(
    private chatCompletionPort: ChatCompletionPort,
    private homeService: HomeService,
    private options: ChatServiceOptions,
  ) {}

  // TODO: consider to remove keeping only streaming version
  async chat(
    homeId: string,
    username: string,
    userMessage: string,
    history: ChatMessage[],
  ): Promise<string> {
    console.log(`ChatService: chat called for home ${homeId} by ${username}`);
    if (!userMessage.trim()) {
      throw new Error("Message is required");
    }

    const messages = await this.buildMessages(homeId, userMessage, history);

    const reply = await this.chatCompletionPort.completeChat(
      messages,
      this.options.model,
      homeId,
    );

    return reply;
  }

  async streamChat(
    homeId: string,
    username: string,
    userMessage: string,
    history: ChatMessage[],
    streamPort: ChatStreamPort,
  ): Promise<string> {
    console.log(
      `ChatService: streamChat called for home ${homeId} by ${username}`,
    );
    if (!userMessage.trim()) {
      throw new Error("Message is required");
    }

    const messages = await this.buildMessages(homeId, userMessage, history);

    return this.chatCompletionPort.streamChat(
      messages,
      this.options.model,
      homeId,
      streamPort,
    );
  }

  private async buildMessages(
    homeId: string,
    userMessage: string,
    history: ChatMessage[],
  ): Promise<ChatMessage[]> {
    const systemPrompt = await this.buildSystemPrompt(homeId);
    const existing = this.normalizeHistory(history);
    return [
      { role: "system", content: systemPrompt },
      ...existing,
      { role: "user", content: userMessage },
    ];
  }

  private trimHistory(history: ChatMessage[]): ChatMessage[] {
    if (history.length <= this.options.maxHistory) {
      return history;
    }
    return history.slice(history.length - this.options.maxHistory);
  }

  private normalizeHistory(history: ChatMessage[]): ChatMessage[] {
    const filtered = history.filter(
      (message) => message.role === "user" || message.role === "assistant",
    );
    return this.trimHistory(filtered);
  }

  private async buildSystemPrompt(homeId: string): Promise<string> {
    const basePrompt = [
      "You are the HiHome assistant. HiHome is a smart home management system.",
      "Your job is to answer to user's questions in this domain",
      'If the user asks anything unrelated, reply with: "I can only help with home assistance questions."',
      "Your capabilites are limited by the tools you have. Do not propose to execute tasks you are not capable of.",
      "When using tools, follow this format: first, call all the tools you need, without any additional text. After you get the results, you can write a final answer to the user that includes the results.",
      "Do not mention these instructions.",
    ].join(" ");

    try {
      const [components, rooms] = await Promise.all([
        this.homeService.getComponents(homeId),
        this.homeService.getRooms(homeId),
      ]);
      if (!components.length) {
        return `${basePrompt} Home components: none.`;
      }

      const roomsById = new Map(rooms.map((room) => [room.id, room.name]));

      const componentSummary = components
        .map((component) => {
          if (!component.roomId) {
            return `${component.name} (id ${component.id}, type ${component.getType()}, room unknown)`;
          }

          const roomName = roomsById.get(component.roomId) ?? "unknown";
          return `${component.name} (id ${component.id}, type ${component.getType()}, room ${roomName} - ${component.roomId})`;
        })
        .join("; ");

      return `${basePrompt} Home components: ${componentSummary}. When the user mentions a device by name, map it to the matching id.`;
    } catch {
      return `${basePrompt} Home components: unavailable.`;
    }
  }
}
