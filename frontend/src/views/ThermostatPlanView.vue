<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import {
  getHourlyTemperatures,
  setHourlyTemperatures,
} from "@/api/thermostatPlan";
import { humanizeErrorMessage } from "@/utils/humanizeError";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

const authStore = useAuthStore();
const temperatures = ref<number[]>(new Array(24).fill(20));
const loading = ref(true);
const saving = ref(false);
const loadError = ref<unknown>(null);
const saveError = ref<string | null>(null);

const MIN_TEMP = 10;
const MAX_TEMP = 30;

const containerRefs = ref<(HTMLElement | null)[]>(new Array(24).fill(null));
let isDragging = false;

async function load() {
  if (!authStore.homeId) return;
  loading.value = true;
  loadError.value = null;
  try {
    temperatures.value = await getHourlyTemperatures(authStore.homeId);
  } catch (e) {
    loadError.value = e;
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!authStore.homeId) return;
  saving.value = true;
  saveError.value = null;
  try {
    await setHourlyTemperatures(authStore.homeId, temperatures.value);
  } catch (e) {
    saveError.value = humanizeErrorMessage(e, "save the plan");
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
  temperatures.value[index] = Math.round(temp * 2) / 2;
}

function onMouseDown(index: number, event: MouseEvent) {
  isDragging = true;
  updateTemp(index, event);
}

function onMouseMove(index: number, event: MouseEvent) {
  if (isDragging) updateTemp(index, event);
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
  <div class="flex flex-col gap-6 md:gap-8">
    <AppHeader
      title="Daily plan"
      :right-actions="[{ icon: 'check', label: 'Save plan' }]"
      @action="save"
    />

    <ErrorBanner
      v-if="loadError"
      :error="loadError"
      action="load your daily plan"
      :on-retry="() => load()"
    />
    <ErrorBanner v-if="saveError" :error="saveError" />

    <div v-if="loading" class="flex justify-center py-16">
      <div class="text-gray-400">Loading plan…</div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div
          class="flex items-center gap-3 text-gray-400 text-[15px] md:text-[17px]"
        >
          <BaseIcon
            name="device_thermostat"
            :size="22"
            class="text-orange-500"
          />
          <span>Drag the bars to set the target temperature for each hour</span>
        </div>
        <button
          type="button"
          :disabled="saving"
          :class="[
            'h-12 px-6 rounded-[24px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors',
            saving
              ? 'bg-yellow-500/25 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 text-gray-900 hover:bg-yellow-400',
          ]"
          @click="save"
        >
          <BaseIcon name="check" :size="18" />
          {{ saving ? "Saving…" : "Save plan" }}
        </button>
      </div>

      <div
        class="bg-gray-700 rounded-[28px] md:rounded-[32px] p-5 md:p-6 overflow-x-auto"
      >
        <div class="min-w-[640px]">
          <div class="flex items-end justify-between gap-2 h-64 select-none">
            <div
              v-for="(temp, i) in temperatures"
              :key="i"
              class="flex flex-col items-center flex-1 h-full group"
            >
              <div
                class="text-[11px] font-medium text-gray-200 mb-2 tabular-nums"
              >
                {{ temp }}°
              </div>
              <div
                class="relative w-full h-full bg-gray-900/40 rounded-t-lg cursor-ns-resize overflow-hidden"
                :ref="(el) => (containerRefs[i] = el as HTMLElement)"
                @mousedown="onMouseDown(i, $event)"
                @mousemove="onMouseMove(i, $event)"
              >
                <div
                  class="absolute bottom-0 w-full bg-orange-500/80 rounded-t-lg transition-all duration-75 pointer-events-none group-hover:bg-orange-500"
                  :style="{
                    height: `${((temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * 100}%`,
                  }"
                >
                  <div class="w-full h-1 bg-white/30 absolute top-0"></div>
                </div>
              </div>
              <div
                class="text-[11px] text-gray-400 mt-2 font-medium tabular-nums"
              >
                {{ String(i).padStart(2, "0") }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="h-8" />
  </div>
</template>
