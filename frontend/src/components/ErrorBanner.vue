<script setup lang="ts">
import { computed } from "vue";
import { humanizeError } from "@/utils/humanizeError";
import BaseIcon from "@/components/BaseIcon.vue";
import type { IconName } from "@/types/ui";

const props = withDefaults(
  defineProps<{
    /**
     * Raw error caught from a failed action. Can be an Error, an ApiError, or
     * a plain string already produced upstream (e.g. by useAsyncAction).
     */
    error: unknown;
    /**
     * Short verb phrase describing what was being attempted, e.g. "save the
     * rule". Used as fallback context when the error itself is generic.
     */
    action?: string;
    /**
     * If provided, a Retry button is shown that invokes this callback.
     */
    onRetry?: (() => void) | null;
    severity?: "error" | "warning";
  }>(),
  { action: undefined, onRetry: null, severity: "error" },
);

const emit = defineEmits<{ retry: [] }>();

const friendly = computed(() => {
  if (typeof props.error === "string") {
    return { title: props.error, detail: "" };
  }
  return humanizeError(props.error, props.action);
});

const icon = computed<IconName>(() =>
  props.severity === "warning" ? "warning" : "info",
);

const tone = computed(() =>
  props.severity === "warning"
    ? {
        border: "border-yellow-500/30",
        bg: "bg-yellow-500/[0.08]",
        text: "text-yellow-500",
      }
    : {
        border: "border-rose-500/30",
        bg: "bg-rose-500/[0.08]",
        text: "text-rose-500",
      },
);

function onRetryClick() {
  props.onRetry?.();
  emit("retry");
}
</script>

<template>
  <div
    role="alert"
    aria-live="polite"
    :class="[
      'rounded-[20px] md:rounded-[24px] border-2 p-4 md:p-5 flex gap-3 md:gap-4 items-start',
      tone.border,
      tone.bg,
    ]"
  >
    <div
      :class="[
        'w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gray-900/40 flex items-center justify-center shrink-0',
        tone.text,
      ]"
    >
      <BaseIcon :name="icon" :size="22" />
    </div>
    <div class="flex-1 min-w-0">
      <div
        :class="[
          'font-semibold text-[15px] md:text-[16px] leading-snug',
          tone.text,
        ]"
      >
        {{ friendly.title }}
      </div>
      <div
        v-if="friendly.detail"
        class="text-[14px] md:text-[15px] text-gray-300 mt-1 leading-snug"
      >
        {{ friendly.detail }}
      </div>
      <div
        v-if="friendly.hint"
        class="text-[13px] md:text-[14px] text-gray-400 mt-1.5 leading-snug"
      >
        {{ friendly.hint }}
      </div>
      <button
        v-if="onRetry != null"
        type="button"
        class="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gray-800/70 border-2 border-gray-800 text-gray-200 text-[13px] md:text-[14px] font-semibold hover:bg-gray-800"
        @click="onRetryClick"
      >
        <BaseIcon name="swap" :size="16" />
        Try again
      </button>
    </div>
  </div>
</template>
