<script setup lang="ts">
import { type PropType } from "vue";
import { ACCENT } from "@/utils/accents";
import type { Accent } from "@/types/ui";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  accent: { type: String as PropType<Accent>, default: "sky" },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
});

const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

function toggle() {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel"
    :disabled="disabled"
    :class="[
      'w-16 h-9 rounded-full p-1 flex items-center transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed',
      modelValue ? ACCENT[accent].bg : 'bg-gray-200/[0.12]',
      modelValue ? 'justify-end' : 'justify-start',
    ]"
    @click.stop="toggle"
  >
    <span
      class="w-7 h-7 rounded-full bg-white shadow-md transition-transform"
    />
  </button>
</template>
