<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useNotificationsStore } from "@/stores/notifications";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import RuleExecutionRecapModal from "@/components/RuleExecutionRecapModal.vue";
import { ACCENT } from "@/utils/accents";
import type { Accent, IconName } from "@/types/ui";
import type { NotificationDTO } from "@/api/notifications";

const store = useNotificationsStore();
const { notifications, isLoading, error } = storeToRefs(store);

type Filter = "all" | "rules" | "metrics";
const filter = ref<Filter>("all");
const recapNotification = ref<NotificationDTO | null>(null);

const TYPE_META: Record<
  string,
  { label: string; icon: IconName; accent: Accent; kind: "rule" | "metric" }
> = {
  AirQualityThresholdBreach: {
    label: "Air quality",
    icon: "air",
    accent: "rose",
    kind: "metric",
  },
  AutomationRuleExecuted: {
    label: "Rule fired",
    icon: "bolt",
    accent: "yellow",
    kind: "rule",
  },
  ComponentAction: {
    label: "Device action",
    icon: "devices",
    accent: "sky",
    kind: "metric",
  },
};

function metaFor(type: string) {
  return (
    TYPE_META[type] ?? {
      label: type,
      icon: "info" as IconName,
      accent: "sky" as Accent,
      kind: "metric" as const,
    }
  );
}

function isClickable(n: NotificationDTO): boolean {
  return n.type === "AutomationRuleExecuted" && !!n.details;
}

function onNotificationClick(n: NotificationDTO) {
  if (isClickable(n)) recapNotification.value = n;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffH < 24) return `${diffH} h ago`;
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) {
    return `Yesterday · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString();
}

function isRecent(iso: string): boolean {
  const ms = Date.now() - new Date(iso).getTime();
  return ms < 24 * 3_600_000;
}

const filtered = computed(() =>
  notifications.value.filter((n) => {
    const meta = metaFor(n.type);
    if (filter.value === "all") return true;
    if (filter.value === "rules") return meta.kind === "rule";
    return meta.kind === "metric";
  }),
);

const todayItems = computed(() =>
  filtered.value.filter((n) => isRecent(n.createdAt)),
);
const earlierItems = computed(() =>
  filtered.value.filter((n) => !isRecent(n.createdAt)),
);

const ruleCount = computed(
  () =>
    notifications.value.filter((n) => metaFor(n.type).kind === "rule").length,
);
const metricCount = computed(
  () =>
    notifications.value.filter((n) => metaFor(n.type).kind === "metric").length,
);

const filters: { id: Filter; label: string; count: () => number }[] = [
  { id: "all", label: "All", count: () => notifications.value.length },
  { id: "rules", label: "Rules", count: () => ruleCount.value },
  { id: "metrics", label: "Metrics", count: () => metricCount.value },
];

onMounted(() => store.fetchAll());
</script>

<template>
  <div class="flex flex-col gap-6 md:gap-8">
    <AppHeader title="Activity" />

    <div class="flex gap-2 items-center flex-wrap">
      <button
        v-for="f in filters"
        :key="f.id"
        type="button"
        :class="[
          'h-10 px-4 rounded-3xl text-sm font-semibold inline-flex items-center gap-2 transition-colors',
          filter === f.id
            ? 'bg-gray-200 text-gray-900'
            : 'bg-transparent border-2 border-gray-800 text-gray-300 hover:bg-white/[0.02]',
        ]"
        @click="filter = f.id"
      >
        {{ f.label }}
        <span
          :class="[
            'text-[13px] px-2 py-0.5 rounded-xl font-semibold',
            filter === f.id
              ? 'bg-gray-900/15 text-gray-900'
              : 'bg-white/[0.08] text-gray-400',
          ]"
        >
          {{ f.count() }}
        </span>
      </button>
    </div>

    <div v-if="error && notifications.length === 0" class="flex flex-col gap-2">
      <p class="text-rose-500 text-sm">{{ error }}</p>
      <button
        type="button"
        class="self-start px-4 py-2 rounded-2xl bg-gray-800/50 border-2 border-gray-800 text-gray-200 text-sm"
        @click="store.fetchAll()"
      >
        Retry
      </button>
    </div>
    <p v-else-if="error" class="text-rose-500 text-sm">{{ error }}</p>

    <p
      v-if="isLoading && notifications.length === 0"
      class="text-gray-400 text-sm"
    >
      Loading notifications…
    </p>

    <p
      v-if="!isLoading && !error && notifications.length === 0"
      class="text-gray-400 text-sm"
    >
      No notifications yet.
    </p>

    <section v-if="todayItems.length">
      <div class="font-medium text-base text-gray-400 mb-3">Today</div>
      <div class="flex flex-col gap-2.5">
        <button
          v-for="n in todayItems"
          :key="n.id"
          type="button"
          :class="[
            'w-full text-left rounded-[24px] md:rounded-[28px] p-4 md:p-5 flex gap-3.5 items-start',
            ACCENT[metaFor(n.type).accent].tint,
            isClickable(n) ? 'cursor-pointer hover:brightness-110' : '',
          ]"
          @click="onNotificationClick(n)"
        >
          <div
            :class="[
              'w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gray-900/60 flex items-center justify-center shrink-0',
              ACCENT[metaFor(n.type).accent].text,
            ]"
          >
            <BaseIcon :name="metaFor(n.type).icon" :size="24" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                :class="[
                  'text-[13px] font-semibold uppercase tracking-wider',
                  ACCENT[metaFor(n.type).accent].text,
                ]"
              >
                {{ metaFor(n.type).label }}
              </span>
              <span class="text-[13px] text-gray-500">·</span>
              <span class="text-[13px] text-gray-400">
                {{ formatTime(n.createdAt) }}
              </span>
            </div>
            <div class="text-[15px] md:text-base leading-[22px] text-gray-100">
              {{ n.message }}
            </div>
            <div
              v-if="isClickable(n)"
              :class="[
                'mt-3 inline-flex items-center gap-1.5 text-[14px] md:text-[15px] font-semibold',
                ACCENT[metaFor(n.type).accent].text,
              ]"
            >
              View details
              <BaseIcon name="chevron_right" :size="18" />
            </div>
          </div>
        </button>
      </div>
    </section>

    <section v-if="earlierItems.length">
      <div class="font-medium text-base text-gray-400 mb-3">Earlier</div>
      <div class="flex flex-col gap-2.5">
        <button
          v-for="n in earlierItems"
          :key="n.id"
          type="button"
          :class="[
            'w-full text-left rounded-[24px] md:rounded-[28px] p-4 md:p-5 flex gap-3.5 items-start bg-gray-800/50',
            isClickable(n) ? 'cursor-pointer hover:bg-gray-800/80' : '',
          ]"
          @click="onNotificationClick(n)"
        >
          <div
            :class="[
              'w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gray-900/60 flex items-center justify-center shrink-0',
              ACCENT[metaFor(n.type).accent].text,
            ]"
          >
            <BaseIcon :name="metaFor(n.type).icon" :size="24" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                :class="[
                  'text-[13px] font-semibold uppercase tracking-wider',
                  ACCENT[metaFor(n.type).accent].text,
                ]"
              >
                {{ metaFor(n.type).label }}
              </span>
              <span class="text-[13px] text-gray-500">·</span>
              <span class="text-[13px] text-gray-400">
                {{ formatTime(n.createdAt) }}
              </span>
            </div>
            <div class="text-[15px] md:text-base leading-[22px] text-gray-100">
              {{ n.message }}
            </div>
          </div>
        </button>
      </div>
    </section>

    <RuleExecutionRecapModal
      v-if="recapNotification"
      :notification="recapNotification"
      @close="recapNotification = null"
    />

    <div class="h-8" />
  </div>
</template>
