<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useChatSocket, type ChatMessage } from "@/composables/useChatSocket";

const authStore = useAuthStore();
const { token, username, homeId } = storeToRefs(authStore);

const { connected, error, sendMessage } = useChatSocket(homeId, token);

type ToolCallInfo = { name: string };

const messages = ref<ChatMessage[]>([
  {
    role: "assistant",
    content: "Welcome! How can I help you today?",
  },
]);
const draft = ref("");
const sending = ref(false);
const sendError = ref<string | null>(null);
const scrollAnchor = ref<HTMLDivElement | null>(null);
const streamingContent = ref("");
const activeToolCalls = ref<ToolCallInfo[]>([]);

const canSend = computed(() =>
  Boolean(draft.value.trim() && username.value && homeId.value),
);

const TOOL_LABELS: Record<string, string> = {
  get_forecast_summary: "Getting forecast",
  add_rule: "Creating automation rule",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name;
}

function onSend() {
  if (!canSend.value) return;

  const content = draft.value.trim();
  const history = messages.value.slice();
  const outgoing: ChatMessage = { role: "user", content };
  sending.value = true;
  sendError.value = null;
  streamingContent.value = "";
  activeToolCalls.value = [];
  messages.value = [...messages.value, outgoing];
  draft.value = "";

  sendMessage(
    {
      message: content,
      username: username.value ?? "User",
      history: [...history, outgoing],
    },
    {
      onToken(token: string) {
        streamingContent.value += token;
      },
      onToolCall(name: string) {
        activeToolCalls.value = [...activeToolCalls.value, { name }];
      },
      onDone(fullContent: string) {
        streamingContent.value = "";
        activeToolCalls.value = [];
        messages.value = [
          ...messages.value,
          { role: "assistant", content: fullContent },
        ];
        sending.value = false;
      },
      onError(err: string) {
        streamingContent.value = "";
        activeToolCalls.value = [];
        sendError.value = err;
        sending.value = false;
      },
    },
  );
}

watch(
  () => [messages.value.length, streamingContent.value],
  async () => {
    await nextTick();
    scrollAnchor.value?.scrollIntoView({ behavior: "smooth" });
  },
);
</script>

<template>
  <div class="flex flex-col gap-4 h-full">
    <header class="flex flex-col gap-2">
      <h1 class="text-2xl font-light text-primary">Chat Assistant</h1>
      <p class="text-sm text-muted">
        Ask about home assistance, devices, energy management, wellness, or the
        forecast.
      </p>
      <p v-if="error" class="text-danger text-sm" role="alert">
        Live chat connection unavailable: {{ error }}
      </p>
      <p v-else-if="!connected" class="text-muted text-sm">Connecting…</p>
    </header>

    <section
      class="flex-1 overflow-auto rounded-2xl border border-border p-4 bg-surface"
    >
      <div v-if="messages.length === 0" class="text-muted text-sm">
        No messages yet. Start the conversation.
      </div>

      <div class="flex flex-col gap-3">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap"
            :class="
              message.role === 'user'
                ? 'bg-primary text-surface'
                : 'bg-elevated text-body'
            "
          >
            {{ message.content }}
          </div>
        </div>

        <!-- Streaming response bubble -->
        <div v-if="sending" class="flex justify-start">
          <div class="max-w-[80%] flex flex-col gap-2">
            <!-- Tool call indicators -->
            <div
              v-for="(tc, i) in activeToolCalls"
              :key="i"
              class="flex items-center gap-2 text-xs text-muted animate-pulse"
            >
              <svg
                class="w-3.5 h-3.5 flex-shrink-0"
                viewBox="0 0 512 512"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M78.6 5C69.1-2.4 55.6-1.5 47.7 7L7.7 47c-8.7 8.7-8.7 22.8 0 31.5l37.1 37.1c-13.5 21-20.8 45.7-20.8 71.4c0 73.4 59.6 133 133 133c25.7 0 50.3-7.3 71.4-20.8l37.1 37.1c8.7 8.7 22.8 8.7 31.5 0l39.3-39.3c8.5-8.1 9.4-21.6 2-31.1L78.6 5zM332.6 265.8l27.5-27.5c4.7-4.7 12.3-4.7 17 0l120.2 120.2c15.6 15.6 15.6 40.9 0 56.6l-29 29c-15.6 15.6-40.9 15.6-56.6 0L291.5 323.3c-4.7-4.7-4.7-12.3 0-17l27.5-27.5 13.6 13.6c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-33.9-33.9l33.9-33.9c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L298.7 190l-13.6-13.6c-4.7-4.7-4.7-12.3 0-17l27.5-27.5L432.8 12.1c15.6-15.6 40.9-15.6 56.6 0l29 29c15.6 15.6 15.6 40.9 0 56.6L398.2 217.9l-13.6-13.6c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l13.6 13.6-17.7 17.7-13.6-13.6c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l.5 .5z"
                />
              </svg>
              <span
                >Called <strong>{{ toolLabel(tc.name) }}</strong></span
              >
            </div>

            <!-- Streaming text -->
            <div
              v-if="streamingContent"
              class="rounded-2xl px-4 py-2 text-sm bg-elevated text-body whitespace-pre-wrap"
            >
              {{ streamingContent }}<span class="animate-pulse">▌</span>
            </div>

            <!-- Thinking indicator when no content yet -->
            <div
              v-else-if="activeToolCalls.length === 0"
              class="rounded-2xl px-4 py-2 text-sm bg-elevated text-muted"
            >
              <span class="animate-pulse">Thinking…</span>
            </div>
          </div>
        </div>
      </div>
      <div ref="scrollAnchor" />
    </section>

    <form class="flex flex-col gap-3" @submit.prevent="onSend">
      <label class="text-sm text-primary">Message</label>
      <textarea
        v-model="draft"
        rows="3"
        placeholder="Type your request…"
        class="bg-elevated rounded-lg px-4 py-3 text-body placeholder:text-muted outline-none border border-border focus:border-primary transition"
      />
      <p v-if="sendError" class="text-danger text-sm" role="alert">
        {{ sendError }}
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          :disabled="!canSend || sending"
          class="sm:w-48 py-3 rounded-xl bg-primary text-surface font-medium hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ sending ? "Sending…" : "Send" }}
        </button>
      </div>
    </form>
  </div>
</template>
