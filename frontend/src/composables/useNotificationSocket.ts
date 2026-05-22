import { ref, onMounted, onBeforeUnmount, watch, type Ref } from "vue";
import { io, type Socket } from "socket.io-client";
import type { NotificationDTO } from "@/api/notifications";
import { useNotificationsStore } from "@/stores/notifications";
import { usePreferencesStore } from "@/stores/preferences";

const AUTO_DISMISS_MS = 5000;

export function useNotificationSocket(
  homeId: Ref<string | null>,
  token: Ref<string | null>,
) {
  const store = useNotificationsStore();
  const prefsStore = usePreferencesStore();
  const toasts = ref<NotificationDTO[]>([]);
  let socket: Socket | null = null;

  function onNotification(data: NotificationDTO) {
    store.addRealtime(data);
    if (prefsStore.preferences.includes(data.type as any)) {
      toasts.value = [...toasts.value, data];
      setTimeout(() => dismiss(data.id), AUTO_DISMISS_MS);
    }
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function connect(id: string) {
    const currentToken = token.value;
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

    currentSocket.on("notification", onNotification);
  }

  function disconnect() {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  }

  function reset(nextId: string | null) {
    disconnect();
    if (nextId) connect(nextId);
  }

  onMounted(() => {
    if (homeId.value) connect(homeId.value);
  });

  watch(homeId, (next, prev) => {
    if (next !== prev) reset(next);
  });

  watch(token, (next, prev) => {
    if (next !== prev) reset(homeId.value);
  });

  onBeforeUnmount(() => disconnect());

  return { toasts, dismiss };
}
