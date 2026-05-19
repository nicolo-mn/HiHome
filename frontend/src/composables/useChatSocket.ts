import { ref, onMounted, onBeforeUnmount, watch, type Ref } from "vue";
import { io, type Socket } from "socket.io-client";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

type ChatPayload = {
  message: string;
  username: string;
  history: ChatMessage[];
};

type ChatResponse = { reply?: string; error?: string };

const ACK_TIMEOUT_MS = 12_000;

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

  async function sendMessage(payload: ChatPayload): Promise<string> {
    const currentSocket = socket;
    if (!currentSocket || !connected.value) {
      throw new Error("Chat connection is not available");
    }

    return new Promise((resolve, reject) => {
      let resolved = false;
      const timer = window.setTimeout(() => {
        if (resolved) return;
        resolved = true;
        reject(new Error("Chat reply timed out"));
      }, ACK_TIMEOUT_MS);

      currentSocket.emit("chat:send", payload, (response: ChatResponse) => {
        if (resolved) return;
        resolved = true;
        window.clearTimeout(timer);
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        if (!response?.reply) {
          reject(new Error("Chat reply was empty"));
          return;
        }
        resolve(response.reply);
      });
    });
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
