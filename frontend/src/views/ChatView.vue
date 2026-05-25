<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import {
  useChatSocket,
  type ChatMessage,
  type ToolCallInfo,
} from "@/composables/useChatSocket";
import { renderMarkdown } from "@/utils/markdown";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";

const authStore = useAuthStore();
const { token, username, homeId } = storeToRefs(authStore);

const { connected, error, sendMessage } = useChatSocket(homeId, token);

const STORAGE_PREFIX = "hihome.chat.messages";
const messages = ref<ChatMessage[]>([]);
const draft = ref("");
const sending = ref(false);
const sendError = ref<string | null>(null);
const scrollAnchor = ref<HTMLDivElement | null>(null);
const streamingContent = ref("");
const activeToolCalls = ref<ToolCallInfo[]>([]);

const streamingHtml = computed(() =>
  streamingContent.value ? renderMarkdown(`${streamingContent.value}▌`) : "",
);

const storageKey = computed(() => {
  const id = homeId.value ?? "anonymous";
  const user = username.value ?? "guest";
  return `${STORAGE_PREFIX}:${id}:${user}`;
});

const canSend = computed(() =>
  Boolean(draft.value.trim() && username.value && homeId.value),
);

const suggestions = [
  "What is the indoor temperature?",
  "Turn off all the lights",
  "Set the thermostat to 21°C",
  "What's the weather forecast?",
];

const TOOL_LABELS: Record<string, string> = {
  get_forecast_summary: "Getting forecast",
  add_rule: "Creating automation rule",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name;
}

function renderMessage(content: string): string {
  return renderMarkdown(content);
}

function applySuggestion(text: string) {
  draft.value = text;
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
        streamingContent.value = "";
        activeToolCalls.value = [...activeToolCalls.value, { name }];
      },
      onDone(fullContent: string) {
        const toolCallsSnapshot = activeToolCalls.value.slice();
        streamingContent.value = "";
        activeToolCalls.value = [];
        messages.value = [
          ...messages.value,
          {
            role: "assistant",
            content: fullContent,
            toolCalls: toolCallsSnapshot,
          },
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

function loadStoredMessages(key: string): ChatMessage[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const filtered = parsed.filter(
      (entry) =>
        entry &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string",
    );
    return filtered.length > 0 ? filtered : null;
  } catch {
    return null;
  }
}

function persistMessages(key: string, value: ChatMessage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content: "Welcome! How can I help you today?",
};

function resetChat() {
  messages.value = [welcomeMessage];
  persistMessages(storageKey.value, [welcomeMessage]);
  streamingContent.value = "";
  activeToolCalls.value = [];
  sendError.value = null;
  sending.value = false;
}

function ensureWelcomeMessage() {
  messages.value = [welcomeMessage];
  streamingContent.value = "";
  activeToolCalls.value = [];
  sendError.value = null;
  sending.value = false;
}

function onDraftKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  onSend();
}

watch(
  () => [messages.value.length, streamingContent.value],
  async () => {
    await nextTick();
    scrollAnchor.value?.scrollIntoView({ behavior: "smooth" });
  },
);

watch(
  storageKey,
  (key) => {
    const stored = loadStoredMessages(key);
    if (stored !== null) {
      messages.value = stored;
      streamingContent.value = "";
      activeToolCalls.value = [];
      sendError.value = null;
      sending.value = false;
      return;
    }
    ensureWelcomeMessage();
  },
  { immediate: true },
);

watch(
  [storageKey, messages],
  ([key, current]) => {
    persistMessages(key, current);
  },
  { deep: true },
);

const onlyWelcome = computed(
  () => messages.value.length <= 1 && !sending.value,
);
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-8 pb-32 md:pb-8">
    <AppHeader
      title="Assistant"
      :right-actions="[{ icon: 'add', label: 'New chat' }]"
      @action="resetChat"
    />

    <p v-if="error" class="text-rose-500 text-sm">
      Live chat connection unavailable: {{ error }}
    </p>
    <p v-else-if="!connected" class="text-gray-500 text-sm">Connecting…</p>

    <section v-if="onlyWelcome" class="flex flex-col gap-3">
      <div class="font-medium text-[18px] md:text-[20px] text-gray-400">
        Suggestions
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <button
          v-for="s in suggestions"
          :key="s"
          type="button"
          class="h-[92px] md:h-[104px] rounded-[26px] md:rounded-[32px] bg-gray-200/[0.08] px-6 flex items-center text-left text-gray-300 font-bold text-[18px] md:text-[20px] hover:bg-gray-200/[0.12] transition-colors"
          @click="applySuggestion(s)"
        >
          {{ s }}
        </button>
      </div>
    </section>

    <section
      class="flex-1 flex flex-col gap-3 rounded-[26px] md:rounded-[32px] bg-gray-800/30 p-4 md:p-5 min-h-[280px]"
    >
      <div class="flex flex-col gap-3">
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div class="max-w-[80%] flex flex-col gap-2">
            <div
              v-if="message.role === 'assistant' && message.toolCalls?.length"
              class="flex flex-col gap-1"
            >
              <div
                v-for="(tc, i) in message.toolCalls"
                :key="i"
                class="flex items-center gap-2 text-xs text-gray-500"
              >
                <BaseIcon name="bolt" :size="14" />
                <span>
                  Called <strong>{{ toolLabel(tc.name) }}</strong>
                </span>
              </div>
            </div>

            <div
              class="rounded-2xl px-4 py-2.5 text-[15px]"
              :class="
                message.role === 'user'
                  ? 'bg-sky-500 text-gray-50 whitespace-pre-wrap'
                  : 'bg-gray-700 text-gray-200'
              "
            >
              <template v-if="message.role === 'assistant'">
                <div
                  class="chat-markdown"
                  v-html="renderMessage(message.content)"
                />
              </template>
              <template v-else>
                {{ message.content }}
              </template>
            </div>
          </div>
        </div>

        <div v-if="sending" class="flex justify-start">
          <div class="max-w-[80%] flex flex-col gap-2">
            <div
              v-for="(tc, i) in activeToolCalls"
              :key="i"
              class="flex items-center gap-2 text-xs text-gray-500 animate-pulse"
            >
              <BaseIcon name="bolt" :size="14" />
              <span>
                Called <strong>{{ toolLabel(tc.name) }}</strong>
              </span>
            </div>

            <div
              v-if="streamingContent"
              class="rounded-2xl px-4 py-2.5 text-[15px] bg-gray-700 text-gray-200"
            >
              <div class="chat-markdown" v-html="streamingHtml" />
            </div>

            <div
              v-else-if="activeToolCalls.length === 0"
              class="rounded-2xl px-4 py-2.5 text-[15px] bg-gray-700 text-gray-500"
            >
              <span class="animate-pulse">Thinking…</span>
            </div>
          </div>
        </div>
      </div>
      <div ref="scrollAnchor" />
    </section>

    <p v-if="sendError" class="text-rose-500 text-sm">{{ sendError }}</p>

    <div
      class="md:hidden fixed left-4 right-4 bottom-28 z-20 h-14 rounded-full bg-gray-700 px-4 flex items-center gap-2 shadow-2xl"
    >
      <BaseIcon name="search" :size="22" class="text-gray-400" />
      <input
        v-model="draft"
        placeholder="Ask anything…"
        class="flex-1 bg-transparent border-0 outline-none text-gray-200 placeholder:text-gray-400 text-[15px] min-w-0"
        @keydown="onDraftKeydown"
      />
      <button
        type="button"
        :disabled="!canSend || sending"
        class="w-9 h-9 rounded-full bg-sky-500 flex items-center justify-center text-gray-900 disabled:opacity-50"
        @click="onSend"
      >
        <BaseIcon name="send" :size="18" />
      </button>
    </div>

    <div
      class="hidden md:flex sticky bottom-6 z-20 h-16 rounded-full bg-gray-700 px-5 items-center gap-3 shadow-2xl border border-white/[0.04]"
    >
      <BaseIcon name="search" :size="22" class="text-gray-400" />
      <input
        v-model="draft"
        placeholder="Ask anything…"
        class="flex-1 bg-transparent border-0 outline-none text-gray-200 placeholder:text-gray-400 text-[17px] min-w-0"
        @keydown="onDraftKeydown"
      />
      <button
        type="button"
        :disabled="!canSend || sending"
        class="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-gray-900 hover:bg-sky-400 disabled:opacity-50"
        @click="onSend"
      >
        <BaseIcon name="send" :size="20" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-markdown :deep(p) {
  margin: 0;
}

.chat-markdown :deep(p + p) {
  margin-top: 0.5rem;
}

.chat-markdown :deep(ul),
.chat-markdown :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.chat-markdown :deep(code) {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 0.375rem;
  padding: 0.1rem 0.35rem;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

.chat-markdown :deep(pre) {
  background: rgba(15, 23, 42, 0.7);
  border-radius: 0.75rem;
  margin: 0.5rem 0 0;
  overflow-x: auto;
  padding: 0.75rem;
}

.chat-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
}

.chat-markdown :deep(a) {
  color: inherit;
  text-decoration: underline;
}
</style>
