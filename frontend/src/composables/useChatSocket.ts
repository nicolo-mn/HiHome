import { ref, onMounted, onBeforeUnmount, watch, type Ref } from "vue";
import { io, type Socket } from "socket.io-client";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

type ChatPayload = {
  message: string;
  username: string;
  history: ChatMessage[];
};

export type StreamCallbacks = {
  onToken: (content: string) => void;
  onToolCall: (name: string) => void;
  onDone: (content: string) => void;
  onError: (error: string) => void;
};

const ACK_TIMEOUT_MS = 5_000;

export function useChatSocket(
  homeId: Ref<string | null> | string | null,
  token: Ref<string | null> | string | null = null,
) {
  const homeIdRef: Ref<string | null> =
    typeof homeId === "string" || homeId === null ? ref(homeId) : homeId;
  const tokenRef: Ref<string | null> =
    typeof token === "string" || token === null ? ref(token) : token;

  const connected = ref(false);
  const error = ref<string | null>(null);
  let socket: Socket | null = null;

  function connect(id: string) {
    const currentToken = tokenRef.value;
    const currentSocket: Socket = io({
      query: { homeId: id },
      ...(currentToken ? { auth: { token: currentToken } } : {}),
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socket = currentSocket;

    currentSocket.on("connect", () => {
      connected.value = true;
      error.value = null;
    });

    currentSocket.on("disconnect", () => {
      connected.value = false;
    });

    currentSocket.on("connect_error", (err: Error) => {
      connected.value = false;
      error.value = err.message || "Connection error";
    });

    currentSocket.on("error", (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Socket error";
      error.value = message;
    });
  }

  function disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
    connected.value = false;
  }

  function reset(nextId: string | null) {
    disconnect();
    error.value = null;
    if (nextId) connect(nextId);
  }

  function sendMessage(payload: ChatPayload, callbacks: StreamCallbacks): void {
    const currentSocket = socket;
    if (!currentSocket || !connected.value) {
      callbacks.onError("Chat connection is not available");
      return;
    }

    const onToken = (data: { content: string }) =>
      callbacks.onToken(data.content);
    const onToolCall = (data: { name: string }) =>
      callbacks.onToolCall(data.name);

    const cleanup = () => {
      currentSocket.off("chat:token", onToken);
      currentSocket.off("chat:tool-call", onToolCall);
      currentSocket.off("chat:done", onDone);
      currentSocket.off("chat:error", onErr);
    };

    const onDone = (data: { content: string }) => {
      cleanup();
      callbacks.onDone(data.content);
    };

    const onErr = (data: { error: string }) => {
      cleanup();
      callbacks.onError(data.error);
    };

    currentSocket.on("chat:token", onToken);
    currentSocket.on("chat:tool-call", onToolCall);
    currentSocket.on("chat:done", onDone);
    currentSocket.on("chat:error", onErr);

    currentSocket.emit(
      "chat:send",
      payload,
      (ackResponse: { error?: string }) => {
        if (ackResponse?.error) {
          cleanup();
          callbacks.onError(ackResponse.error);
        }
      },
    );

    // Safety timeout — if nothing comes back in a long while, clean up
    const STREAM_TIMEOUT_MS = 60_000;
    setTimeout(() => {
      cleanup();
    }, STREAM_TIMEOUT_MS);
  }

  onMounted(() => {
    if (homeIdRef.value) connect(homeIdRef.value);
  });

  watch(homeIdRef, (next, prev) => {
    if (next !== prev) reset(next);
  });

  watch(tokenRef, (next, prev) => {
    if (next !== prev) reset(homeIdRef.value);
  });

  onBeforeUnmount(() => disconnect());

  return {
    connected,
    error,
    sendMessage,
  };
}
