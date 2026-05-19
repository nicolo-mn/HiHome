<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useChatSocket, type ChatMessage } from "@/composables/useChatSocket";

const authStore = useAuthStore();
const { token, username, homeId } = storeToRefs(authStore);

const { connected, error, sendMessage } = useChatSocket(homeId, token);

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

const canSend = computed(() =>
  Boolean(draft.value.trim() && username.value && homeId.value),
);

async function onSend() {
  if (!canSend.value) return;

  const content = draft.value.trim();
  const history = messages.value.slice();
  const outgoing: ChatMessage = { role: "user", content };
  sending.value = true;
  sendError.value = null;
  messages.value = [...messages.value, outgoing];
  draft.value = "";

  try {
    const reply = await sendMessage({
      message: content,
      username: username.value ?? "User",
      history: [...history, outgoing],
    });

    messages.value = [...messages.value, { role: "assistant", content: reply }];
  } catch (err) {
    sendError.value =
      err instanceof Error ? err.message : "Chat request failed";
  } finally {
    sending.value = false;
  }
}

watch(
  () => messages.value.length,
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
            class="max-w-[80%] rounded-2xl px-4 py-2 text-sm"
            :class="
              message.role === 'user'
                ? 'bg-primary text-surface'
                : 'bg-elevated text-body'
            "
          >
            {{ message.content }}
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
