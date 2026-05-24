<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useUsageStore } from "@/stores/usage";
import type { UsageRange } from "@/api/usage";
import MetricCard from "@/components/cards/MetricCard.vue";
import BaseButton from "@/components/BaseButton.vue";
import insightsIcon from "@/assets/icons/insights.svg?raw";
import lightIcon from "@/assets/icons/light.svg?raw";
import windowIcon from "@/assets/icons/window.svg?raw";
import bellIcon from "@/assets/icons/bell.svg?raw";

const store = useUsageStore();
const { report, range, isLoading, error } = storeToRefs(store);

const ranges: { value: UsageRange; label: string }[] = [
  { value: "week", label: "Last 7 days" },
];

const totalActions = computed(() => {
  if (!report.value) return 0;
  const { manual, automated } = report.value.manualVsAutomated;
  return manual + automated;
});

const manualPct = computed(() => {
  if (!report.value || totalActions.value === 0) return 0;
  return Math.round(
    (report.value.manualVsAutomated.manual / totalActions.value) * 100,
  );
});

const automatedPct = computed(() =>
  totalActions.value === 0 ? 0 : 100 - manualPct.value,
);

const hourMax = computed(() => {
  if (!report.value) return 0;
  return Math.max(1, ...report.value.activityByHour);
});

const peakHour = computed(() => {
  if (!report.value) return null;
  let bestIndex = -1;
  let bestCount = 0;
  report.value.activityByHour.forEach((count, idx) => {
    if (count > bestCount) {
      bestCount = count;
      bestIndex = idx;
    }
  });
  if (bestIndex < 0) return null;
  return `${String(bestIndex).padStart(2, "0")}:00`;
});

function fmt(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

function selectRange(next: UsageRange) {
  store.setRange(next);
}

onMounted(() => store.load());
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <span
          class="w-10 h-10 rounded-2xl bg-elevated border border-border flex items-center justify-center text-primary"
          v-html="insightsIcon"
        />
        <div>
          <h1 class="text-2xl font-light text-primary">Usage Insights</h1>
          <p class="text-sm text-muted">
            Energy consumption and activity across your home.
          </p>
        </div>
      </div>

      <div
        class="inline-flex w-fit rounded-xl bg-elevated border border-border p-1"
      >
        <button
          v-for="r in ranges"
          :key="r.value"
          type="button"
          class="px-4 py-1.5 text-sm rounded-lg transition"
          :class="
            range === r.value
              ? 'bg-primary text-surface font-medium'
              : 'text-muted hover:text-primary'
          "
          @click="selectRange(r.value)"
        >
          {{ r.label }}
        </button>
      </div>
    </header>

    <div v-if="error && !report" class="flex flex-col gap-2">
      <p class="text-danger text-sm">{{ error }}</p>
      <BaseButton label="Retry" @click="store.load()" />
    </div>
    <p v-else-if="error" class="text-danger text-sm">{{ error }}</p>

    <div v-if="isLoading && !report" class="text-muted text-sm">
      Loading insights…
    </div>

    <div
      v-if="report"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <MetricCard
        :icon="lightIcon"
        label="Energy / week"
        :value="fmt(report.energyKWhPerWeek, 2)"
        unit="kWh"
        subtitle="From lights on-time"
      />
      <MetricCard
        :icon="lightIcon"
        label="Lights on / week"
        :value="fmt(report.lightsOnHoursPerWeek, 1)"
        unit="hours"
        subtitle="Across all lights"
      />
      <MetricCard
        :icon="windowIcon"
        label="Windows open"
        :value="fmt(report.windowOpenHours, 1)"
        unit="hours"
        subtitle="Total in period"
      />
      <MetricCard
        :icon="bellIcon"
        label="Manual vs automated"
        :value="totalActions === 0 ? '—' : `${manualPct}%`"
        :unit="totalActions === 0 ? '' : 'manual'"
        :subtitle="
          totalActions === 0
            ? 'No actions in period'
            : `${report.manualVsAutomated.manual} manual · ${report.manualVsAutomated.automated} automated`
        "
      >
        <div
          v-if="totalActions > 0"
          class="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-surface"
        >
          <div class="h-full bg-primary" :style="{ width: `${manualPct}%` }" />
          <div
            class="h-full bg-success"
            :style="{ width: `${automatedPct}%` }"
          />
        </div>
      </MetricCard>

      <div
        class="sm:col-span-2 lg:col-span-2 flex flex-col gap-3 px-5 py-5 rounded-2xl bg-elevated border border-border"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs uppercase tracking-wide text-muted">
            Activity by hour
          </span>
          <span v-if="peakHour" class="text-xs text-muted">
            Peak: <span class="text-primary">{{ peakHour }}</span>
          </span>
        </div>
        <div class="flex items-end gap-1 h-32">
          <div
            v-for="(count, hour) in report.activityByHour"
            :key="hour"
            class="flex-1 h-full flex flex-col justify-end items-center group"
            :title="`${String(hour).padStart(2, '0')}:00 — ${count} actions`"
          >
            <div
              class="w-full rounded-t bg-primary/30 group-hover:bg-primary transition"
              :style="{
                height: `${(Math.sqrt(count) / Math.sqrt(hourMax)) * 100}%`,
                minHeight: count > 0 ? '4px' : '2px',
              }"
            />
          </div>
        </div>
        <div class="flex justify-between text-[10px] text-muted">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
          <span>23</span>
        </div>
      </div>
    </div>
  </div>
</template>
