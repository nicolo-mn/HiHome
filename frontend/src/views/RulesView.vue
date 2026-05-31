<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { rulesApi, devicesApi } from "@/api";
import type { RuleDto } from "@/api/rules";
import type { HomeDevice } from "@/api/devices";
import { useAuthStore } from "@/stores/auth";
import { useAsyncAction } from "@/composables/useAsyncAction";
import AppHeader from "@/components/AppHeader.vue";
import RuleCard from "@/components/RuleCard.vue";
import ErrorBanner from "@/components/ErrorBanner.vue";

const router = useRouter();
const authStore = useAuthStore();
const homeId = computed(() => authStore.homeId);

const rules = ref<RuleDto[]>([]);
const devices = ref<HomeDevice[]>([]);

const sortedRules = computed(() =>
  [...rules.value].sort((a, b) => a.order - b.order),
);

const {
  run: load,
  isLoading,
  error,
} = useAsyncAction(
  async () => {
    if (!homeId.value) return;
    const [rulesData, devicesData] = await Promise.all([
      rulesApi.getRules(homeId.value),
      devicesApi.getDevices(homeId.value),
    ]);
    rules.value = rulesData;
    devices.value = devicesData;
  },
  { action: "load your rules" },
);

const { run: remove, error: deleteError } = useAsyncAction(
  async (ruleId: string) => {
    if (!homeId.value) return;
    await rulesApi.deleteRule(homeId.value, ruleId);
    await load();
  },
  { action: "delete the rule" },
);

const { run: reorder, error: reorderError } = useAsyncAction(
  async (orderedIds: string[]) => {
    if (!homeId.value) return;
    const snapshot = rules.value;
    rules.value = orderedIds
      .map((id, index) => {
        const rule = snapshot.find((r) => r.id === id);
        return rule ? { ...rule, order: index } : null;
      })
      .filter((r): r is RuleDto => r !== null);
    try {
      await rulesApi.reorderRules(homeId.value, orderedIds);
    } catch (err) {
      rules.value = snapshot;
      throw err;
    }
  },
  { action: "reorder your rules" },
);

function swap(ids: string[], i: number, j: number) {
  const tmp = ids[i] as string;
  ids[i] = ids[j] as string;
  ids[j] = tmp;
}

function moveUp(index: number) {
  if (index <= 0) return;
  const ids = sortedRules.value.map((r) => r.id);
  swap(ids, index - 1, index);
  reorder(ids);
}

function moveDown(index: number) {
  if (index >= sortedRules.value.length - 1) return;
  const ids = sortedRules.value.map((r) => r.id);
  swap(ids, index, index + 1);
  reorder(ids);
}

onMounted(load);
</script>

<template>
  <div class="flex flex-col gap-8 md:gap-10">
    <AppHeader
      title="Rules"
      :right-actions="[{ icon: 'add', label: 'New rule' }]"
      @action="router.push({ name: 'rule-create' })"
    />

    <ErrorBanner
      v-if="error"
      :error="error"
      action="load your rules"
      :on-retry="() => load()"
    />
    <ErrorBanner
      v-if="deleteError"
      :error="deleteError"
      action="delete the rule"
    />
    <ErrorBanner
      v-if="reorderError"
      :error="reorderError"
      action="reorder your rules"
    />

    <p v-if="isLoading && rules.length === 0" class="text-white text-sm">
      Loading rules…
    </p>

    <p v-else-if="rules.length === 0" class="text-white text-sm">
      No rules configured yet.
    </p>

    <div v-else class="grid grid-cols-1 gap-3">
      <RuleCard
        v-for="(rule, index) in sortedRules"
        :key="rule.id"
        :rule="rule"
        :devices="devices"
        :can-move-up="index > 0"
        :can-move-down="index < sortedRules.length - 1"
        @delete="remove(rule.id)"
        @move-up="moveUp(index)"
        @move-down="moveDown(index)"
      />
    </div>

    <div class="h-8" />
  </div>
</template>
