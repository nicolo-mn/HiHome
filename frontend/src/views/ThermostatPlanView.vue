<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import {
  getHourlyTemperatures,
  setHourlyTemperatures,
} from "@/api/thermostatPlan";

const authStore = useAuthStore();
const temperatures = ref<number[]>(new Array(24).fill(20));
const loading = ref(true);
const saving = ref(false);

const MIN_TEMP = 10;
const MAX_TEMP = 30;

const containerRefs = ref<(HTMLElement | null)[]>(new Array(24).fill(null));
let isDragging = false;

async function load() {
  if (!authStore.homeId) return;
  loading.value = true;
  try {
    temperatures.value = await getHourlyTemperatures(authStore.homeId);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!authStore.homeId) return;
  saving.value = true;
  try {
    await setHourlyTemperatures(authStore.homeId, temperatures.value);
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
}

function updateTemp(index: number, event: MouseEvent) {
  const container = containerRefs.value[index];
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const y = event.clientY - rect.top;
  const percentage = 1 - Math.max(0, Math.min(1, y / rect.height));
  const temp = MIN_TEMP + percentage * (MAX_TEMP - MIN_TEMP);
  temperatures.value[index] = Math.round(temp * 2) / 2; // Snap to 0.5
}

function onMouseDown(index: number, event: MouseEvent) {
  isDragging = true;
  updateTemp(index, event);
}

function onMouseMove(index: number, event: MouseEvent) {
  if (isDragging) {
    updateTemp(index, event);
  }
}

function onMouseUp() {
  isDragging = false;
}

onMounted(() => {
  load();
  window.addEventListener("mouseup", onMouseUp);
});

onUnmounted(() => {
  window.removeEventListener("mouseup", onMouseUp);
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-primary">Daily Thermostat Plan</h1>
      <button
        class="rounded-lg bg-primary text-surface px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
        @click="save"
        :disabled="saving"
      >
        {{ saving ? "Saving..." : "Save Plan" }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-pulse flex flex-col items-center text-muted">
        <div
          class="h-8 w-8 mb-4 border-4 border-t-primary border-primary/30 rounded-full animate-spin"
        ></div>
        <span>Loading plan...</span>
      </div>
    </div>

    <div
      v-else
      class="rounded-2xl border border-border bg-surface p-6 shadow-sm overflow-x-auto"
    >
      <div class="min-w-[600px]">
        <div class="flex items-end justify-between space-x-2 h-64 select-none">
          <div
            v-for="(temp, i) in temperatures"
            :key="i"
            class="flex flex-col items-center flex-1 h-full group"
          >
            <div
              class="text-xs font-medium text-primary mb-2 transition-transform group-hover:-translate-y-1"
            >
              {{ temp }}°
            </div>
            <div
              class="relative w-full h-full bg-elevated rounded-t-lg cursor-ns-resize overflow-hidden"
              :ref="(el) => (containerRefs[i] = el as HTMLElement)"
              @mousedown="onMouseDown(i, $event)"
              @mousemove="onMouseMove(i, $event)"
            >
              <div
                class="absolute bottom-0 w-full bg-primary/90 rounded-t-lg transition-all duration-75 pointer-events-none group-hover:bg-primary"
                :style="{
                  height: `${((temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}%`,
                }"
              >
                <div class="w-full h-1 bg-white/30 absolute top-0"></div>
              </div>
            </div>
            <div class="text-xs text-muted mt-3 font-medium">
              {{ String(i).padStart(2, "0") }}:00
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
