<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { rulesApi, componentsApi } from "@/api";
import type { RuleDto } from "@/api/rules";
import type { HomeComponent } from "@/api/components";
import { useAuthStore } from "@/stores/auth";
import { useAsyncAction } from "@/composables/useAsyncAction";
import BaseButton from "@/components/BaseButton.vue";
import RuleCard from "@/components/RuleCard.vue";

const router = useRouter();
const authStore = useAuthStore();
const homeId = computed(() => authStore.homeId);

const rules = ref<RuleDto[]>([]);
const components = ref<HomeComponent[]>([]);

const sortedRules = computed(() =>
  [...rules.value].sort((a, b) => a.order - b.order),
);

const {
  run: load,
  isLoading,
  error,
} = useAsyncAction(async () => {
  if (!homeId.value) return;
  const [rulesData, componentsData] = await Promise.all([
    rulesApi.getRules(homeId.value),
    componentsApi.getComponents(homeId.value),
  ]);
  rules.value = rulesData;
  components.value = componentsData;
});

const { run: remove, error: deleteError } = useAsyncAction(
  async (ruleId: string) => {
    await rulesApi.deleteRule(ruleId);
    await load();
  },
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
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-primary">Rules</h1>
      <div class="w-40">
        <BaseButton
          label="New rule"
          @click="router.push({ name: 'rule-create' })"
        />
      </div>
    </div>

    <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
    <p v-if="deleteError" class="text-red-400 text-sm">{{ deleteError }}</p>
    <p v-if="reorderError" class="text-red-400 text-sm">{{ reorderError }}</p>

    <div v-if="isLoading && rules.length === 0" class="text-muted text-sm">
      Loading rules…
    </div>

    <p v-else-if="rules.length === 0" class="text-muted text-sm">
      No rules configured yet.
    </p>

    <div v-else class="flex flex-col gap-3">
      <RuleCard
        v-for="(rule, index) in sortedRules"
        :key="rule.id"
        :rule="rule"
        :components="components"
        :can-move-up="index > 0"
        :can-move-down="index < sortedRules.length - 1"
        @delete="remove(rule.id)"
        @move-up="moveUp(index)"
        @move-down="moveDown(index)"
      />
    </div>
  </div>
</template>
