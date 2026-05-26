export enum ChatStreamEventType {
  Token = "token",
  ToolCall = "tool_call",
  Done = "done",
  Error = "error",
}

export type ChatStreamEvent =
  | { type: ChatStreamEventType.Token; content: string }
  | { type: ChatStreamEventType.ToolCall; name: string }
  | { type: ChatStreamEventType.Done; content: string }
  | { type: ChatStreamEventType.Error; error: string };

export interface ChatStreamPort {
  emit(event: ChatStreamEvent): void;
}
