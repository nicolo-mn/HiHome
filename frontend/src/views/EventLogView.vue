<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useEventLogStore } from "@/stores/event-log";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import { ACCENT } from "@/utils/accents";
import type { Accent, IconName } from "@/types/ui";
import type { ComponentEventDTO } from "@/api/event-log";

const store = useEventLogStore();
const { events, isLoading, error } = storeToRefs(store);

type Filter = "all" | "manual" | "automation";
const filter = ref<Filter>("all");
const search = ref("");

const TYPE_META: Record<string, { icon: IconName; accent: Accent }> = {
  light: { icon: "lamp", accent: "yellow" },
  window: { icon: "window", accent: "emerald" },
  thermostat: { icon: "device_thermostat", accent: "orange" },
};

function metaFor(type: string) {
  return (
    TYPE_META[type] ?? { icon: "info" as IconName, accent: "sky" as Accent }
  );
}

function isAutomation(e: ComponentEventDTO): boolean {
  return !e.actor;
}

function formatAction(e: ComponentEventDTO): string {
  switch (e.eventType) {
    case "LightTurnedOn":
      return "Turned on";
    case "LightTurnedOff":
      return "Turned off";
    case "WindowOpened":
      return "Opened";
    case "WindowClosed":
      return "Closed";
    case "ThermostatSet":
      return `Set temperature to ${e.targetTemperature.toFixed(1)}°C`;
    default:
      return "Unknown action";
  }
}

function formatComponentLabel(e: ComponentEventDTO): string {
  return e.componentName?.trim().length ? e.componentName : e.componentId;
}

function formatType(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatActor(e: ComponentEventDTO) {
  if (!e.actor) return "Automation";
  return e.actor.username;
}

function formatDateLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return events.value.filter((e) => {
    const matchesQ =
      !q ||
      formatComponentLabel(e).toLowerCase().includes(q) ||
      e.componentType.toLowerCase().includes(q) ||
      (e.actor?.username ?? "").toLowerCase().includes(q) ||
      formatAction(e).toLowerCase().includes(q);
    const matchesF =
      filter.value === "all"
        ? true
        : filter.value === "manual"
          ? !isAutomation(e)
          : isAutomation(e);
    return matchesQ && matchesF;
  });
});

const groups = computed(() => {
  const out: { date: string; items: ComponentEventDTO[] }[] = [];
  filtered.value.forEach((e) => {
    const label = formatDateLabel(e.createdAt);
    const last = out[out.length - 1];
    if (last && last.date === label) last.items.push(e);
    else out.push({ date: label, items: [e] });
  });
  return out;
});

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All sources" },
  { id: "manual", label: "Manual" },
  { id: "automation", label: "Automation" },
];

onMounted(() => store.fetchAll());
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-8">
    <AppHeader title="Event log" />

    <div class="flex flex-col gap-3 max-w-[820px]">
      <div
        class="bg-gray-800/50 border-2 border-gray-800 rounded-[24px] md:rounded-[28px] px-[18px] py-3.5 flex items-center gap-3"
      >
        <BaseIcon name="search" :size="22" class="text-gray-400" />
        <input
          v-model="search"
          placeholder="Search device, user or action…"
          class="flex-1 bg-transparent border-0 outline-none text-gray-200 text-[16px] md:text-[17px] placeholder:text-gray-500 min-w-0"
        />
        <button
          v-if="search"
          type="button"
          class="text-gray-400 flex"
          @click="search = ''"
        >
          <BaseIcon name="close" :size="20" />
        </button>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          :class="[
            'h-[38px] px-4 rounded-[22px] text-sm font-semibold transition-colors',
            filter === f.id
              ? 'bg-gray-200 text-gray-900'
              : 'bg-transparent border-2 border-gray-800 text-gray-300 hover:bg-white/[0.02]',
          ]"
          @click="filter = f.id"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-rose-500 text-sm">{{ error }}</p>
    <p v-if="isLoading && events.length === 0" class="text-gray-400 text-sm">
      Loading event log…
    </p>

    <div class="max-w-[820px]">
      <p
        v-if="!isLoading && !error && groups.length === 0"
        class="text-center text-gray-400 p-16 text-[17px]"
      >
        No events match your filter.
      </p>

      <div v-for="g in groups" :key="g.date" class="mb-7">
        <div
          class="font-medium text-base text-gray-400 mb-3 flex items-center gap-3"
        >
          <span>{{ g.date }}</span>
          <div class="flex-1 h-px bg-white/5" />
          <span class="text-[13px] text-gray-500">
            {{ g.items.length }} event{{ g.items.length === 1 ? "" : "s" }}
          </span>
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="e in g.items"
            :key="e.id"
            class="bg-gray-800/50 border-2 border-gray-800 rounded-3xl p-4 flex gap-3.5 items-start"
          >
            <div
              :class="[
                'w-[48px] h-[48px] md:w-[52px] md:h-[52px] rounded-[18px] flex items-center justify-center shrink-0',
                ACCENT[metaFor(e.componentType).accent].tint,
                ACCENT[metaFor(e.componentType).accent].text,
              ]"
            >
              <BaseIcon :name="metaFor(e.componentType).icon" :size="24" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2 mb-1 flex-wrap">
                <span
                  class="font-bold text-[17px] md:text-[18px] text-gray-200"
                >
                  {{ formatType(e.componentType) }}
                </span>
                <span class="text-[14px] md:text-[15px] text-gray-400">
                  · {{ formatComponentLabel(e) }}
                </span>
              </div>
              <div
                class="text-[15px] md:text-base font-medium mb-2"
                :style="{
                  color: `var(--color-${metaFor(e.componentType).accent}-500)`,
                }"
              >
                {{ formatAction(e) }}
              </div>
              <div
                class="flex flex-wrap gap-2 items-center text-[13px] text-gray-400"
              >
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2.5 py-[3px] rounded-xl bg-white/[0.06]',
                    isAutomation(e) ? 'text-yellow-500' : 'text-gray-300',
                  ]"
                >
                  <BaseIcon
                    :name="isAutomation(e) ? 'bolt' : 'user'"
                    :size="14"
                  />
                  {{ formatActor(e) }}
                </span>
                <span
                  class="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-xl bg-white/[0.06]"
                >
                  <BaseIcon name="schedule" :size="14" />
                  {{ formatTime(e.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="h-8" />
    </div>
  </div>
</template>
