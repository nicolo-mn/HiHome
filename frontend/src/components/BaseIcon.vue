<script setup lang="ts">
import { computed, type PropType } from "vue";
import { ICON_PATHS, ICON_VIEWBOXES } from "@/utils/icons";
import type { IconName } from "@/types/ui";

const props = defineProps({
  name: { type: String as PropType<IconName>, required: true },
  size: { type: [Number, String] as PropType<number | string>, default: 24 },
});

const d = computed(() => ICON_PATHS[props.name]);
const viewBox = computed(() => ICON_VIEWBOXES[props.name] ?? "0 0 24 24");
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    :viewBox="viewBox"
    fill="none"
    class="block shrink-0"
    aria-hidden="true"
  >
    <path :d="d" fill="currentColor" />
  </svg>
</template>
