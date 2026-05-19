import type { ChatMessage } from "./ChatService";

export type ChatStreamEvent =
  | { type: "token"; content: string }
  | { type: "tool_call"; name: string }
  | { type: "done"; content: string }
  | { type: "error"; message: string };

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
    onEvent: (event: ChatStreamEvent) => void,
  ): Promise<string>;
}
