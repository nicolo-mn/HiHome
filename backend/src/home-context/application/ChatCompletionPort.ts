import type { ChatMessage } from "./ChatService";

export interface ChatCompletionPort {
  completeChat(messages: ChatMessage[], model: string): Promise<string>;
}
