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

const historicalDays = computed(
  () => report.value?.historicalWeather?.days ?? [],
);

const dayLabels = computed(() =>
  historicalDays.value.map((day) => formatDayLabel(day.date)),
);

const tempMinSeries = computed(() =>
  historicalDays.value.map((day) => day.temperatureMin),
);

const tempMaxSeries = computed(() =>
  historicalDays.value.map((day) => day.temperatureMax),
);

const tempBounds = computed(() => {
  const values = [...tempMinSeries.value, ...tempMaxSeries.value];
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(min + 1, ...values);
  return { min, max };
});

const tempMinPath = computed(() =>
  buildLinePath(tempMinSeries.value, tempBounds.value),
);

const tempMaxPath = computed(() =>
  buildLinePath(tempMaxSeries.value, tempBounds.value),
);

const precipitationSeries = computed(() =>
  historicalDays.value.map((day) => day.precipitationSum),
);

const precipitationMax = computed(() =>
  Math.max(1, ...precipitationSeries.value),
);

const hourlyAqiSeries = computed(() => {
  const values: number[] = [];
  for (const day of historicalDays.value) {
    for (const hour of day.hourlyAirQuality) {
      values.push(hour.europeanAqi);
    }
  }
  return values;
});

const aqiBounds = computed(() => {
  if (hourlyAqiSeries.value.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...hourlyAqiSeries.value);
  const max = Math.max(min + 1, ...hourlyAqiSeries.value);
  return { min, max };
});

const aqiPath = computed(() =>
  buildLinePath(hourlyAqiSeries.value, aqiBounds.value),
);

function fmt(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

function formatDayLabel(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(parsed);
}

function buildLinePath(
  values: number[],
  bounds: { min: number; max: number },
  padding = 2,
): string {
  if (values.length === 0) return "";
  const width = 100;
  const height = 40;
  const areaHeight = height - 2 * padding;
  const range = Math.max(1, bounds.max - bounds.min);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const t = (value - bounds.min) / range;
      const y = padding + areaHeight * (1 - t);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
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

      <div
        class="sm:col-span-2 lg:col-span-2 flex flex-col gap-3 px-5 py-5 rounded-2xl bg-elevated border border-border"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs uppercase tracking-wide text-muted">
            Daily temperature range (past week)
          </span>
          <div class="flex items-center gap-3 text-[11px] text-muted">
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-primary" /> Max
            </span>
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-success" /> Min
            </span>
          </div>
        </div>
        <div v-if="historicalDays.length" class="flex flex-col gap-2">
          <div class="flex gap-1">
            <div
              class="flex flex-col justify-between h-32 text-[10px] text-muted leading-none"
            >
              <span class="-mt-1">{{ fmt(tempBounds.max, 1) }}°</span>
              <span class="-mb-1">{{ fmt(tempBounds.min, 1) }}°</span>
            </div>
            <div class="flex-1 flex flex-col gap-2">
              <svg
                viewBox="0 0 100 40"
                class="w-full h-32"
                preserveAspectRatio="none"
              >
                <path
                  v-if="tempMaxPath"
                  :d="tempMaxPath"
                  fill="none"
                  stroke="currentColor"
                  class="text-primary"
                  stroke-width="1"
                  stroke-linejoin="round"
                />
                <path
                  v-if="tempMinPath"
                  :d="tempMinPath"
                  fill="none"
                  stroke="currentColor"
                  class="text-success"
                  stroke-width="1"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="flex justify-between text-[10px] text-muted">
                <span v-for="(label, idx) in dayLabels" :key="`temp-${idx}`">
                  {{ label }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-muted">Historical data not ready yet.</p>
      </div>

      <div
        class="flex flex-col gap-3 px-5 py-5 rounded-2xl bg-elevated border border-border"
      >
        <span class="text-xs uppercase tracking-wide text-muted">
          Daily precipitation (past week)
        </span>
        <div v-if="historicalDays.length" class="flex flex-col gap-2">
          <div class="flex gap-1">
            <div
              class="flex flex-col justify-between h-28 text-[10px] text-muted leading-none"
            >
              <span class="-mt-1">{{ fmt(precipitationMax, 1) }} mm</span>
              <span class="-mb-1">0</span>
            </div>
            <div class="flex-1 flex flex-col gap-2">
              <div class="flex items-end gap-2 h-28">
                <div
                  v-for="(value, idx) in precipitationSeries"
                  :key="`precip-${idx}`"
                  class="flex-1 flex flex-col items-center justify-end"
                  :title="`${fmt(value, 1)} mm`"
                >
                  <div
                    class="w-full rounded-t bg-primary/30"
                    :style="{
                      height: `${(value / precipitationMax) * 100}%`,
                      minHeight: value > 0 ? '4px' : '2px',
                    }"
                  />
                </div>
              </div>
              <div class="flex gap-2 text-[10px] text-muted">
                <span
                  v-for="(label, idx) in dayLabels"
                  :key="`precip-label-${idx}`"
                  class="flex-1 text-center"
                >
                  {{ label }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-muted">Historical data not ready yet.</p>
      </div>

      <div
        class="sm:col-span-2 lg:col-span-3 flex flex-col gap-3 px-5 py-5 rounded-2xl bg-elevated border border-border"
      >
        <div class="flex items-center">
          <span class="text-xs uppercase tracking-wide text-muted">
            AQI (past week)
          </span>
        </div>
        <div v-if="hourlyAqiSeries.length" class="flex flex-col gap-2">
          <div class="flex gap-1">
            <div
              class="flex flex-col justify-between h-32 text-[10px] text-muted leading-none"
            >
              <span class="-mt-1">{{ Math.round(aqiBounds.max) }}</span>
              <span class="-mb-1">{{ Math.round(aqiBounds.min) }}</span>
            </div>
            <div class="flex-1 flex flex-col gap-2">
              <svg
                viewBox="0 0 100 40"
                class="w-full h-32"
                preserveAspectRatio="none"
              >
                <path
                  v-if="aqiPath"
                  :d="aqiPath"
                  fill="none"
                  stroke="currentColor"
                  class="text-amber-500"
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
              <div class="flex justify-between text-[10px] text-muted">
                <span v-for="(label, idx) in dayLabels" :key="`aqi-${idx}`">
                  {{ label }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-muted">Historical data not ready yet.</p>
      </div>
    </div>
  </div>
</template>
