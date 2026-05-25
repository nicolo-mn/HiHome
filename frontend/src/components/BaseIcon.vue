<script setup lang="ts">
import { computed, type PropType } from "vue";
import { ICON_PATHS } from "@/utils/icons";
import type { IconName } from "@/types/ui";

const props = defineProps({
  name: { type: String as PropType<IconName>, required: true },
  size: { type: [Number, String] as PropType<number | string>, default: 24 },
});

const d = computed(() => ICON_PATHS[props.name]);
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    class="block shrink-0"
    aria-hidden="true"
  >
    <path :d="d" fill="currentColor" />
  </svg>
</template>
