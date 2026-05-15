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
    rules.value = rules.value.filter((r) => r.id !== ruleId);
  },
);

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

    <div v-if="isLoading && rules.length === 0" class="text-muted text-sm">
      Loading rules…
    </div>

    <p v-else-if="rules.length === 0" class="text-muted text-sm">
      No rules configured yet.
    </p>

    <div v-else class="flex flex-col gap-3">
      <RuleCard
        v-for="rule in rules"
        :key="rule.id"
        :rule="rule"
        :components="components"
        @delete="remove(rule.id)"
      />
    </div>
  </div>
</template>
