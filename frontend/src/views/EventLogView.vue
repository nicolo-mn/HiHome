<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useEventLogStore } from "@/stores/event-log";
import type { ComponentEventDTO } from "@/api/event-log";
import componentsIcon from "@/assets/icons/components.svg?raw";
import BaseButton from "@/components/BaseButton.vue";

const store = useEventLogStore();
const { events, isLoading, error } = storeToRefs(store);

const totalEvents = computed(() => events.value.length);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatActor(
  eventActor: { username: string; role: string } | undefined,
) {
  if (!eventActor) return "System";
  return `${eventActor.username} (${eventActor.role})`;
}

function formatComponentLabel(event: {
  componentName?: string;
  componentId: string;
}) {
  return event.componentName?.trim().length
    ? event.componentName
    : event.componentId;
}

function formatAction(event: ComponentEventDTO) {
  switch (event.eventType) {
    case "LightTurnedOn":
      return "Turned on";
    case "LightTurnedOff":
      return "Turned off";
    case "WindowOpened":
      return "Opened";
    case "WindowClosed":
      return "Closed";
    case "ThermostatSet":
      return `Set temperature to ${event.targetTemperature.toFixed(1)}°C`;
    default:
      return "Unknown action";
  }
}

function formatType(type: string) {
  return type.replace(/^[a-z]/, (c) => c.toUpperCase());
}

onMounted(() => store.fetchAll());
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <span
          class="w-8 h-8 rounded-2xl bg-elevated border border-border flex items-center justify-center"
          v-html="componentsIcon"
        />
        <div>
          <h1 class="text-2xl font-light text-primary">Component Event Log</h1>
          <p class="text-sm text-muted">
            Admin-only history of component actions across this home.
          </p>
        </div>
      </div>
      <div class="text-xs text-muted">
        {{ totalEvents }} event{{ totalEvents === 1 ? "" : "s" }} recorded
      </div>
    </header>

    <div v-if="error && events.length === 0" class="flex flex-col gap-2">
      <p class="text-danger text-sm">{{ error }}</p>
      <BaseButton label="Retry" @click="store.fetchAll()" />
    </div>
    <p v-else-if="error" class="text-danger text-sm">{{ error }}</p>

    <div v-if="isLoading && events.length === 0" class="text-muted text-sm">
      Loading event log…
    </div>

    <p
      v-if="!isLoading && !error && events.length === 0"
      class="text-muted text-sm"
    >
      No component events yet.
    </p>

    <div class="flex flex-col gap-3">
      <div
        v-for="event in events"
        :key="event.id"
        class="flex items-start gap-3 px-4 py-3 rounded-xl bg-elevated border border-border"
      >
        <span
          class="w-8 h-8 rounded-full bg-surface border border-border text-primary flex items-center justify-center text-xs font-semibold"
        >
          {{ formatType(event.componentType).slice(0, 1) }}
        </span>
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-medium text-primary">
              {{ formatType(event.componentType) }}
            </span>
            <span class="text-body text-sm">
              {{ formatComponentLabel(event) }}
            </span>
            <span class="text-muted text-xs">•</span>
            <span class="text-body text-sm">{{ formatAction(event) }}</span>
          </div>
          <div
            class="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted"
          >
            <span>By {{ formatActor(event.actor) }}</span>
            <span>•</span>
            <span>{{ formatDate(event.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
