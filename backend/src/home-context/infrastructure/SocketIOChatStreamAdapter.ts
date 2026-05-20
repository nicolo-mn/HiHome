import { Socket } from "socket.io";
import {
  ChatStreamEventType,
  type ChatStreamEvent,
  type ChatStreamPort,
} from "../application/ChatStreamPort";

export class SocketIOChatStreamAdapter implements ChatStreamPort {
  constructor(private socket: Socket) {}

  emit(event: ChatStreamEvent): void {
    if (event.type === ChatStreamEventType.Token) {
      this.socket.emit("chat:token", { content: event.content });
      return;
    }

    if (event.type === ChatStreamEventType.ToolCall) {
      this.socket.emit("chat:tool-call", { name: event.name });
      return;
    }

    if (event.type === ChatStreamEventType.Done) {
      this.socket.emit("chat:done", { content: event.content });
      return;
    }

    if (event.type === ChatStreamEventType.Error) {
      this.socket.emit("chat:error", { error: event.error });
    }
  }
}
