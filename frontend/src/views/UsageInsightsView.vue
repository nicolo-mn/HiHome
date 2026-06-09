<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useUsageStore } from "@/stores/usage";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";
import MetricCard from "@/components/cards/MetricCard.vue";
import lightIcon from "@/assets/icons/light.svg?raw";
import windowIcon from "@/assets/icons/window.svg?raw";
import bellIcon from "@/assets/icons/bell.svg?raw";

const store = useUsageStore();
const { report, isLoading, error } = storeToRefs(store);

const W = 457;
const H = 240;
const padL = 28;
const padR = 12;
const padT = 16;
const padB = 30;
const innerW = W - padL - padR;
const innerH = H - padT - padB;

const hours = computed(() => report.value?.activityByHour ?? []);
const maxHour = computed(() => Math.max(1, ...hours.value));

const barWidth = computed(() =>
  hours.value.length ? innerW / hours.value.length - 2 : 0,
);

function xFor(i: number) {
  return padL + (i / Math.max(1, hours.value.length)) * innerW;
}

function hForCount(count: number) {
  return (count / maxHour.value) * innerH;
}

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

const peakHourIndex = computed(() => {
  if (!report.value) return -1;
  let best = -1;
  let bestCount = 0;
  report.value.activityByHour.forEach((c, i) => {
    if (c > bestCount) {
      bestCount = c;
      best = i;
    }
  });
  return best;
});

const peakHour = computed(() =>
  peakHourIndex.value >= 0
    ? `${String(peakHourIndex.value).padStart(2, "0")}:00`
    : "—",
);

// Real peak count for display (0 when no activity); maxHour keeps its 1 floor
// only for chart scaling.
const peakCount = computed(() => Math.max(0, ...hours.value));

const totalDay = computed(() => hours.value.reduce((sum, n) => sum + n, 0));

const hoveredBar = ref<number | null>(null);
const hoveredTempDayIndex = ref<number | null>(null);
const hoveredPrecipIndex = ref<number | null>(null);
const hoveredAqiIndex = ref<number | null>(null);

const tooltipPos = computed(() => {
  if (hoveredBar.value === null) return { x: 0, y: 0 };
  const i = hoveredBar.value;
  const cx = xFor(i) + barWidth.value / 2;
  const barH = hForCount(hours.value[i] ?? 0);
  return {
    x: Math.min(Math.max(cx, 38), W - 38),
    y: Math.max(padT + innerH - barH - 10, padT + 14),
  };
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

const tempTooltipStyle = computed(() => {
  if (hoveredTempDayIndex.value === null) return {};
  const i = hoveredTempDayIndex.value;
  const len = historicalDays.value.length;
  const pct = len <= 1 ? 0 : (i / (len - 1)) * 100;
  return {
    left: `${pct}%`,
    top: "-36px",
    transform: `translateX(-${pct}%)`,
  };
});

const precipitationSeries = computed(() =>
  historicalDays.value.map((day) => day.precipitationSum),
);

const precipitationMax = computed(() =>
  Math.max(1, ...precipitationSeries.value),
);

const precipTooltipStyle = computed(() => {
  if (hoveredPrecipIndex.value === null) return {};
  const i = hoveredPrecipIndex.value;
  const len = precipitationSeries.value.length;
  const pct = len === 0 ? 0 : ((i + 0.5) / len) * 100;
  return {
    left: `${pct}%`,
    top: "-36px",
    transform: `translateX(-${pct}%)`,
  };
});

const hourlyAqiSeries = computed(() => {
  const values: number[] = [];
  for (const day of historicalDays.value) {
    for (const hour of day.hourlyAirQuality) {
      values.push(hour.europeanAqi);
    }
  }
  return values;
});

const hourlyAqiData = computed(() => {
  const list: { time: string; date: string; value: number }[] = [];
  for (const day of historicalDays.value) {
    for (const hour of day.hourlyAirQuality) {
      list.push({
        time: hour.time,
        date: day.date,
        value: hour.europeanAqi,
      });
    }
  }
  return list;
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

const aqiTooltipStyle = computed(() => {
  if (hoveredAqiIndex.value === null) return {};
  const i = hoveredAqiIndex.value;
  const len = hourlyAqiSeries.value.length;
  const pct = len <= 1 ? 0 : (i / (len - 1)) * 100;
  return {
    left: `${pct}%`,
    top: "-36px",
    transform: `translateX(-${pct}%)`,
  };
});

function fmt(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

function formatDayLabel(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(parsed);
}

function formatHourLabel(timeStr: string): string {
  const parsed = new Date(timeStr);
  if (Number.isNaN(parsed.getTime())) {
    const match = timeStr.match(/T(\d{2}:\d{2})/);
    return match && match[1] ? match[1] : timeStr;
  }
  const weekday = new Intl.DateTimeFormat("en", { weekday: "short" }).format(
    parsed,
  );
  const time = new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
  return `${weekday} ${time}`;
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

onMounted(() => store.load());
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-8">
    <AppHeader title="Insights" />

    <ErrorBanner
      v-if="error"
      :error="error"
      action="load usage insights"
      :on-retry="() => store.load()"
    />

    <div v-if="isLoading && !report" class="text-white text-sm">
      Loading insights…
    </div>

    <template v-if="report">
      <div class="font-medium text-[18px] md:text-[20px] text-white">
        Activity (last 7 days)
      </div>

      <div
        class="bg-gray-700 rounded-[28px] md:rounded-[32px] p-5 md:p-6 flex flex-col gap-4"
      >
        <div class="flex justify-between items-start gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-11 h-11 rounded-[14px] bg-sky-500/[0.16] flex items-center justify-center text-sky-500 shrink-0"
            >
              <BaseIcon name="chart" :size="26" />
            </div>
            <div class="min-w-0">
              <div
                class="font-bold text-[20px] md:text-[22px] text-gray-200 truncate"
              >
                Hourly activity
              </div>
              <div class="text-sm text-white truncate">
                {{ totalDay }} actions over the period
              </div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div
              class="font-bold text-3xl md:text-4xl text-gray-200 leading-10 tabular-nums"
            >
              {{ peakCount > 0 ? peakCount : "—" }}
            </div>
            <div class="text-[12px] md:text-[13px] font-semibold text-sky-500">
              Peak · {{ peakHour }}
            </div>
          </div>
        </div>

        <div class="relative mt-1 w-full" style="aspect-ratio: 457 / 240">
          <svg
            :viewBox="`0 0 ${W} ${H}`"
            preserveAspectRatio="none"
            class="w-full h-full overflow-visible"
            @mouseleave="hoveredBar = null"
          >
            <g stroke="rgba(229,231,235,0.06)" stroke-width="1">
              <line
                v-for="frac in [0.25, 0.5, 0.75, 1]"
                :key="frac"
                :x1="padL"
                :x2="W - padR"
                :y1="padT + innerH * (1 - frac)"
                :y2="padT + innerH * (1 - frac)"
              />
            </g>

            <g
              v-for="(count, i) in hours"
              :key="i"
              style="cursor: pointer"
              @mouseenter="hoveredBar = i"
              @mouseleave="hoveredBar = null"
            >
              <rect
                :x="xFor(i)"
                :y="padT"
                :width="barWidth + 2"
                :height="innerH"
                fill="transparent"
              />
              <rect
                :x="xFor(i) + 1"
                :y="padT + innerH - hForCount(count)"
                :width="barWidth"
                :height="hForCount(count)"
                rx="2"
                fill="#0EA5E9"
                :opacity="i === peakHourIndex || i === hoveredBar ? 1 : 0.55"
              />
            </g>

            <g font-size="11" fill="#9CA3AF" text-anchor="middle">
              <text :x="padL" :y="H - 10">00</text>
              <text :x="padL + innerW * 0.25" :y="H - 10">06</text>
              <text :x="padL + innerW * 0.5" :y="H - 10">12</text>
              <text :x="padL + innerW * 0.75" :y="H - 10">18</text>
              <text :x="padL + innerW" :y="H - 10">23</text>
            </g>

            <g v-if="hoveredBar !== null" style="pointer-events: none">
              <rect
                :x="tooltipPos.x - 36"
                :y="tooltipPos.y - 14"
                width="72"
                height="16"
                rx="3"
                fill="#111827"
                opacity="0.92"
              />
              <text
                :x="tooltipPos.x"
                :y="tooltipPos.y - 3"
                text-anchor="middle"
                font-size="10"
                fill="#F9FAFB"
              >
                {{
                  `${String(hoveredBar).padStart(2, "0")}:00 · ${hours[hoveredBar]}`
                }}
              </text>
            </g>
          </svg>
        </div>

        <div class="grid grid-cols-3 gap-2 mt-1">
          <div class="bg-gray-900/50 rounded-2xl px-3 md:px-3.5 py-3">
            <div
              class="text-[11px] md:text-xs text-white uppercase tracking-wider font-medium"
            >
              Total
            </div>
            <div class="flex items-baseline gap-1 mt-1">
              <span
                class="font-bold text-[22px] md:text-[26px] text-gray-200 leading-[30px] tabular-nums"
              >
                {{ totalDay }}
              </span>
            </div>
          </div>
          <div class="bg-gray-900/50 rounded-2xl px-3 md:px-3.5 py-3">
            <div
              class="text-[11px] md:text-xs text-white uppercase tracking-wider font-medium"
            >
              Peak
            </div>
            <div class="flex items-baseline gap-1 mt-1">
              <span
                class="font-bold text-[22px] md:text-[26px] leading-[30px] text-sky-500 tabular-nums"
              >
                {{ peakCount > 0 ? peakCount : "—" }}
              </span>
              <span v-if="peakCount > 0" class="text-xs text-white">/h</span>
            </div>
            <div class="text-xs text-white mt-0.5">{{ peakHour }}</div>
          </div>
          <div class="bg-gray-900/50 rounded-2xl px-3 md:px-3.5 py-3">
            <div
              class="text-[11px] md:text-xs text-white uppercase tracking-wider font-medium"
            >
              Manual %
            </div>
            <div class="flex items-baseline gap-1 mt-1">
              <span
                class="font-bold text-[22px] md:text-[26px] leading-[30px] text-yellow-500 tabular-nums"
              >
                {{ totalActions === 0 ? "—" : `${manualPct}%` }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="font-medium text-[18px] md:text-[20px] text-white mt-2">
        Metrics
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3"
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
          label="Windows open / week"
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
            class="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-gray-900/40"
          >
            <div
              class="h-full bg-yellow-500"
              :style="{ width: `${manualPct}%` }"
            />
            <div
              class="h-full bg-emerald-500"
              :style="{ width: `${automatedPct}%` }"
            />
          </div>
        </MetricCard>
      </div>

      <div class="font-medium text-[18px] md:text-[20px] text-white mt-2">
        Weather (past week)
      </div>

      <div
        class="bg-gray-700 rounded-[28px] md:rounded-[32px] p-5 md:p-6 flex flex-col gap-4"
      >
        <div class="flex items-center justify-between gap-3">
          <div class="font-bold text-[18px] md:text-[20px] text-gray-200">
            Daily temperature range
          </div>
          <div class="flex items-center gap-3 text-[12px] text-white">
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-sky-500" /> Max
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500" /> Min
            </span>
          </div>
        </div>
        <div v-if="historicalDays.length" class="flex gap-2">
          <div
            class="flex flex-col justify-between h-32 text-[11px] text-white leading-none tabular-nums"
          >
            <span class="-mt-1">{{ fmt(tempBounds.max, 1) }}°</span>
            <span class="-mb-1">{{ fmt(tempBounds.min, 1) }}°</span>
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="relative w-full h-32">
              <svg
                viewBox="0 0 100 40"
                class="w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  v-if="tempMaxPath"
                  :d="tempMaxPath"
                  fill="none"
                  stroke="#0EA5E9"
                  stroke-width="1"
                  stroke-linejoin="round"
                  vector-effect="non-scaling-stroke"
                />
                <path
                  v-if="tempMinPath"
                  :d="tempMinPath"
                  fill="none"
                  stroke="#10B981"
                  stroke-width="1"
                  stroke-linejoin="round"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
              <!-- Hover indicator line -->
              <div
                v-if="hoveredTempDayIndex !== null"
                class="absolute top-0 bottom-0 pointer-events-none border-l border-dashed border-gray-400/40"
                :style="{
                  left: `${historicalDays.length <= 1 ? 0 : (hoveredTempDayIndex / (historicalDays.length - 1)) * 100}%`,
                }"
              />
              <!-- Hover Dots -->
              <div
                v-if="hoveredTempDayIndex !== null"
                class="absolute pointer-events-none w-2 h-2 rounded-full bg-sky-500 border border-white -translate-x-1/2 -translate-y-1/2 shadow"
                :style="{
                  left: `${historicalDays.length <= 1 ? 0 : (hoveredTempDayIndex / (historicalDays.length - 1)) * 100}%`,
                  top: `${5 + 90 * (1 - ((tempMaxSeries[hoveredTempDayIndex] ?? 0) - tempBounds.min) / (tempBounds.max - tempBounds.min))}%`,
                }"
              />
              <div
                v-if="hoveredTempDayIndex !== null"
                class="absolute pointer-events-none w-2 h-2 rounded-full bg-emerald-500 border border-white -translate-x-1/2 -translate-y-1/2 shadow"
                :style="{
                  left: `${historicalDays.length <= 1 ? 0 : (hoveredTempDayIndex / (historicalDays.length - 1)) * 100}%`,
                  top: `${5 + 90 * (1 - ((tempMinSeries[hoveredTempDayIndex] ?? 0) - tempBounds.min) / (tempBounds.max - tempBounds.min))}%`,
                }"
              />
              <!-- Hover overlay -->
              <div class="absolute inset-0 flex">
                <div
                  v-for="(_, idx) in historicalDays"
                  :key="`temp-hover-${idx}`"
                  class="flex-1 h-full cursor-pointer"
                  @mouseenter="hoveredTempDayIndex = idx"
                  @mouseleave="hoveredTempDayIndex = null"
                />
              </div>
              <!-- Tooltip -->
              <div
                v-if="hoveredTempDayIndex !== null"
                class="absolute pointer-events-none bg-gray-900/95 border border-gray-800 text-[11px] text-white px-2 py-1 rounded shadow-lg flex gap-2 items-center whitespace-nowrap transition-all duration-100 z-10"
                :style="tempTooltipStyle"
              >
                <span class="font-bold text-gray-300">{{
                  dayLabels[hoveredTempDayIndex]
                }}</span>
                <span class="text-emerald-400 font-semibold"
                  >{{ fmt(tempMinSeries[hoveredTempDayIndex] ?? 0, 1) }}°</span
                >
                <span class="text-gray-500">–</span>
                <span class="text-sky-400 font-semibold"
                  >{{ fmt(tempMaxSeries[hoveredTempDayIndex] ?? 0, 1) }}°</span
                >
              </div>
            </div>
            <div class="flex justify-between text-[11px] text-white">
              <span v-for="(label, idx) in dayLabels" :key="`temp-${idx}`">
                {{ label }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-white">Historical data not ready yet.</p>
      </div>

      <div
        class="bg-gray-700 rounded-[28px] md:rounded-[32px] p-5 md:p-6 flex flex-col gap-4"
      >
        <div class="font-bold text-[18px] md:text-[20px] text-gray-200">
          Daily precipitation
        </div>
        <div v-if="historicalDays.length" class="flex gap-2">
          <div
            class="flex flex-col justify-between h-28 text-[11px] text-white leading-none tabular-nums"
          >
            <span class="-mt-1">{{ fmt(precipitationMax, 1) }} mm</span>
            <span class="-mb-1">0</span>
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="flex items-end gap-2 h-28 relative">
              <div
                v-for="(value, idx) in precipitationSeries"
                :key="`precip-${idx}`"
                class="flex-1 h-full flex flex-col items-center justify-end cursor-pointer"
                @mouseenter="hoveredPrecipIndex = idx"
                @mouseleave="hoveredPrecipIndex = null"
              >
                <div
                  class="w-full rounded-t transition-colors duration-150"
                  :class="
                    hoveredPrecipIndex === idx ? 'bg-sky-500' : 'bg-sky-500/40'
                  "
                  :style="{
                    height: `${(value / precipitationMax) * 100}%`,
                    minHeight: value > 0 ? '4px' : '2px',
                  }"
                />
              </div>

              <!-- Tooltip -->
              <div
                v-if="hoveredPrecipIndex !== null"
                class="absolute pointer-events-none bg-gray-900/95 border border-gray-800 text-[11px] text-white px-2 py-1 rounded shadow-lg whitespace-nowrap transition-all duration-100 z-10"
                :style="precipTooltipStyle"
              >
                <span class="font-bold text-gray-300">{{
                  dayLabels[hoveredPrecipIndex]
                }}</span>
                <span class="ml-1.5 text-sky-400 font-semibold"
                  >{{
                    fmt(precipitationSeries[hoveredPrecipIndex] ?? 0, 1)
                  }}
                  mm</span
                >
              </div>
            </div>
            <div class="flex gap-2 text-[11px] text-white">
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
        <p v-else class="text-sm text-white">Historical data not ready yet.</p>
      </div>

      <div
        class="bg-gray-700 rounded-[28px] md:rounded-[32px] p-5 md:p-6 flex flex-col gap-4"
      >
        <div class="font-bold text-[18px] md:text-[20px] text-gray-200">
          Air quality (AQI)
        </div>
        <div v-if="hourlyAqiSeries.length" class="flex gap-2">
          <div
            class="flex flex-col justify-between h-32 text-[11px] text-white leading-none tabular-nums"
          >
            <span class="-mt-1">{{ Math.round(aqiBounds.max) }}</span>
            <span class="-mb-1">{{ Math.round(aqiBounds.min) }}</span>
          </div>
          <div class="flex-1 flex flex-col gap-2">
            <div class="relative w-full h-32">
              <svg
                viewBox="0 0 100 40"
                class="w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  v-if="aqiPath"
                  :d="aqiPath"
                  fill="none"
                  stroke="#F59E0B"
                  stroke-width="1"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
              <!-- Hover indicator line -->
              <div
                v-if="hoveredAqiIndex !== null"
                class="absolute top-0 bottom-0 pointer-events-none border-l border-dashed border-gray-400/40"
                :style="{
                  left: `${hourlyAqiSeries.length <= 1 ? 0 : (hoveredAqiIndex / (hourlyAqiSeries.length - 1)) * 100}%`,
                }"
              />
              <!-- Hover Dot -->
              <div
                v-if="hoveredAqiIndex !== null"
                class="absolute pointer-events-none w-2 h-2 rounded-full bg-amber-500 border border-white -translate-x-1/2 -translate-y-1/2 shadow"
                :style="{
                  left: `${hourlyAqiSeries.length <= 1 ? 0 : (hoveredAqiIndex / (hourlyAqiSeries.length - 1)) * 100}%`,
                  top: `${5 + 90 * (1 - ((hourlyAqiSeries[hoveredAqiIndex] ?? 0) - aqiBounds.min) / (aqiBounds.max - aqiBounds.min))}%`,
                }"
              />
              <!-- Hover overlay -->
              <div class="absolute inset-0 flex">
                <div
                  v-for="(_, idx) in hourlyAqiSeries"
                  :key="`aqi-hover-${idx}`"
                  class="flex-1 h-full cursor-pointer"
                  @mouseenter="hoveredAqiIndex = idx"
                  @mouseleave="hoveredAqiIndex = null"
                />
              </div>
              <!-- Tooltip -->
              <div
                v-if="
                  hoveredAqiIndex !== null && hourlyAqiData[hoveredAqiIndex]
                "
                class="absolute pointer-events-none bg-gray-900/95 border border-gray-800 text-[11px] text-white px-2 py-1 rounded shadow-lg whitespace-nowrap transition-all duration-100 z-10"
                :style="aqiTooltipStyle"
              >
                <span class="font-bold text-gray-300">{{
                  formatHourLabel(hourlyAqiData[hoveredAqiIndex]?.time || "")
                }}</span>
                <span class="ml-1.5 text-amber-500 font-semibold"
                  >AQI: {{ hourlyAqiData[hoveredAqiIndex]?.value ?? 0 }}</span
                >
              </div>
            </div>
            <div class="flex justify-between text-[11px] text-white">
              <span v-for="(label, idx) in dayLabels" :key="`aqi-${idx}`">
                {{ label }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-white">Historical data not ready yet.</p>
      </div>

      <div class="h-8" />
    </template>
  </div>
</template>
