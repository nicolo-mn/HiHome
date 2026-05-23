import type { ChatMessage } from "./ChatService";
import type { ChatStreamPort } from "./ChatStreamPort";

export interface ChatCompletionPort {
  streamChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
    streamPort: ChatStreamPort,
    isAdmin: boolean,
  ): Promise<string>;
}
