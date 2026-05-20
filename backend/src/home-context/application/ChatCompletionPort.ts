import type { ChatMessage } from "./ChatService";
import type { ChatStreamPort } from "./ChatStreamPort";

export interface ChatCompletionPort {
  completeChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
  ): Promise<string>;

  streamChat(
    messages: ChatMessage[],
    model: string,
    homeId: string,
    streamPort: ChatStreamPort,
  ): Promise<string>;
}
