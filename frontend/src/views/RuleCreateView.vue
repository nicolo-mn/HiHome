<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { componentsApi, rulesApi } from "@/api";
import { ApiError } from "@/api/errors";
import type { HomeComponent, ComponentType } from "@/api/components";
import { useAuthStore } from "@/stores/auth";
import { useAsyncAction } from "@/composables/useAsyncAction";
import BaseInput from "@/components/BaseInput.vue";
import BaseButton from "@/components/BaseButton.vue";

type OperatorOption = { value: string; label: string };
type EnumOption = { value: string; label: string };

type SensorOption = {
  id: string;
  label: string;
  kind: "numeric" | "enum";
  operators: OperatorOption[];
  options?: EnumOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
};

type ActionOption = {
  value: string;
  label: string;
  needsTarget?: boolean;
  targetLabel?: string;
  targetPlaceholder?: string;
};

type ActionDraft = {
  id: string;
  componentId: string;
  componentType: ComponentType | "";
  command: string;
  targetTemp: string;
};

const fieldClass =
  "bg-elevated rounded-lg px-4 py-3 text-body placeholder:text-muted outline-none border border-border focus:border-primary transition";

const numericOperators: OperatorOption[] = [
  { value: "gt", label: "greater than" },
  { value: "lt", label: "lower than" },
  { value: "eq", label: "equal to" },
];

const weatherOptions: EnumOption[] = [
  { value: "clear", label: "Clear" },
  { value: "cloudy", label: "Cloudy" },
  { value: "drizzle", label: "Drizzle" },
  { value: "fog", label: "Fog" },
  { value: "overcast", label: "Overcast" },
  { value: "rain", label: "Rain" },
  { value: "snow", label: "Snow" },
  { value: "thunderstorm", label: "Thunderstorm" },
];

const sensorOptions: SensorOption[] = [
  {
    id: "internal-thermometer",
    label: "Internal temperature",
    kind: "numeric",
    operators: numericOperators,
    min: -20,
    max: 50,
    step: 0.1,
    unit: "°C",
    placeholder: "20",
  },
  {
    id: "external-thermometer",
    label: "External temperature",
    kind: "numeric",
    operators: numericOperators,
    min: -20,
    max: 50,
    step: 0.1,
    unit: "°C",
    placeholder: "15",
  },
  {
    id: "wind-speed",
    label: "Wind speed",
    kind: "numeric",
    operators: numericOperators,
    min: 0,
    max: 60,
    step: 0.1,
    unit: "m/s",
    placeholder: "5",
  },
  {
    id: "air-quality",
    label: "Air quality",
    kind: "numeric",
    operators: numericOperators,
    min: 0,
    max: 150,
    step: 1,
    unit: "AQI",
    placeholder: "50",
  },
  {
    id: "weather",
    label: "Weather",
    kind: "enum",
    operators: [{ value: "is", label: "is" }],
    options: weatherOptions,
  },
];

const actionOptionsByType: Record<ComponentType, ActionOption[]> = {
  light: [
    { value: "turnOn", label: "Turn on" },
    { value: "turnOff", label: "Turn off" },
  ],
  window: [
    { value: "open", label: "Open" },
    { value: "close", label: "Close" },
  ],
  thermostat: [
    {
      value: "setTemperature",
      label: "Set temperature",
      needsTarget: true,
      targetLabel: "Target temperature",
      targetPlaceholder: "21",
    },
  ],
  unknown: [],
};

const router = useRouter();
const authStore = useAuthStore();
const homeId = computed(() => authStore.homeId);

const components = ref<HomeComponent[]>([]);
const { run: loadComponents, error: loadError } = useAsyncAction(async () => {
  if (!homeId.value) return;
  components.value = await componentsApi.getComponents(homeId.value);
});

onMounted(loadComponents);

const ruleName = ref("");
const condition = ref({
  observableId: sensorOptions[0]?.id ?? "weather",
  operator: sensorOptions[0]?.operators[0]?.value ?? "is",
  operatorTarget: "",
});

let nextActionId = 0;
const actions = ref<ActionDraft[]>([createActionDraft()]);

const selectedSensor = computed(() =>
  sensorOptions.find((s) => s.id === condition.value.observableId),
);
const conditionOperators = computed(
  () => selectedSensor.value?.operators ?? [],
);
const conditionEnumOptions = computed(
  () => selectedSensor.value?.options ?? [],
);
const isNumericCondition = computed(
  () => selectedSensor.value?.kind === "numeric",
);

const usedComponentIds = computed(
  () => new Set(actions.value.map((a) => a.componentId).filter(Boolean)),
);
const canAddAction = computed(
  () => actions.value.length < components.value.length,
);

watch(
  () => condition.value.observableId,
  () => {
    const sensor = selectedSensor.value;
    condition.value.operator = sensor?.operators[0]?.value ?? "";
    if (sensor?.kind === "enum") {
      condition.value.operatorTarget = sensor.options?.[0]?.value ?? "";
    } else {
      condition.value.operatorTarget = "";
    }
  },
);

function createActionDraft(): ActionDraft {
  nextActionId += 1;
  return {
    id: `action-${nextActionId}`,
    componentId: "",
    componentType: "",
    command: "",
    targetTemp: "",
  };
}

function availableComponents(actionId: string): HomeComponent[] {
  const used = new Set(usedComponentIds.value);
  const current = actions.value.find((a) => a.id === actionId);
  if (current?.componentId) used.delete(current.componentId);
  return components.value.filter(
    (c) => c.type !== "unknown" && !used.has(c.id),
  );
}

function getActionOptions(type: ComponentType | ""): ActionOption[] {
  if (!type) return [];
  return actionOptionsByType[type] ?? [];
}

function getActionDefinition(
  type: ComponentType | "",
  command: string,
): ActionOption | undefined {
  return getActionOptions(type).find((o) => o.value === command);
}

function handleComponentSelection(action: ActionDraft) {
  const comp = components.value.find((c) => c.id === action.componentId);
  action.componentType = comp?.type ?? "";
  const commands = getActionOptions(action.componentType);
  action.command = commands[0]?.value ?? "";
  action.targetTemp = "";
}

function handleCommandSelection(action: ActionDraft) {
  const def = getActionDefinition(action.componentType, action.command);
  if (!def?.needsTarget) action.targetTemp = "";
}

function addAction() {
  if (!canAddAction.value) return;
  actions.value.push(createActionDraft());
}

function removeAction(actionId: string) {
  if (actions.value.length === 1) return;
  actions.value = actions.value.filter((a) => a.id !== actionId);
}

function actionNeedsTarget(action: ActionDraft): boolean {
  return (
    getActionDefinition(action.componentType, action.command)?.needsTarget ===
    true
  );
}

function actionTargetLabel(action: ActionDraft): string {
  return (
    getActionDefinition(action.componentType, action.command)?.targetLabel ??
    "Parameter"
  );
}

function actionTargetPlaceholder(action: ActionDraft): string {
  return (
    getActionDefinition(action.componentType, action.command)
      ?.targetPlaceholder ?? ""
  );
}

function getApiErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : null;
}

const {
  run: save,
  isLoading: saving,
  error: saveError,
} = useAsyncAction(
  async () => {
    if (!homeId.value) return;
    const isNumeric = isNumericCondition.value;
    const operatorTarget = isNumeric
      ? Number(condition.value.operatorTarget)
      : condition.value.operatorTarget;

    await rulesApi.createRule(homeId.value, {
      ruleName: ruleName.value,
      observableId: condition.value.observableId,
      operator: condition.value.operator,
      operatorTarget,
      actions: actions.value.map((a) => ({
        componentId: a.componentId,
        componentType: a.componentType as ComponentType,
        command: a.command,
        targetTemp: a.targetTemp === "" ? undefined : Number(a.targetTemp),
      })),
    });
    router.push({ name: "rules" });
  },
  {
    onError: (error) => getApiErrorMessage(error),
  },
);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-primary">New rule</h1>
      <button
        type="button"
        class="text-sm text-muted hover:text-primary transition"
        @click="router.push({ name: 'rules' })"
      >
        ← Back to rules
      </button>
    </div>

    <p v-if="loadError" class="text-red-400 text-sm">{{ loadError }}</p>
    <p v-if="saveError" class="text-red-400 text-sm">{{ saveError }}</p>

    <section class="bg-surface border border-border rounded-2xl p-4 md:p-6">
      <div class="flex flex-col gap-4">
        <h2 class="text-lg font-medium text-primary">Rule details</h2>
        <BaseInput
          label="Rule title"
          v-model="ruleName"
          placeholder="Morning comfort"
        />
      </div>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-4 md:p-6">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-primary">Condition</h2>
          <span class="text-xs text-muted">Single trigger per rule</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-primary">Sensor</label>
            <select v-model="condition.observableId" :class="fieldClass">
              <option v-for="s in sensorOptions" :key="s.id" :value="s.id">
                {{ s.label }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-primary">Operator</label>
            <select v-model="condition.operator" :class="fieldClass">
              <option
                v-for="op in conditionOperators"
                :key="op.value"
                :value="op.value"
              >
                {{ op.label }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm text-primary">Target</label>
            <input
              v-if="isNumericCondition"
              v-model="condition.operatorTarget"
              type="number"
              :min="selectedSensor?.min"
              :max="selectedSensor?.max"
              :step="selectedSensor?.step"
              :placeholder="selectedSensor?.placeholder"
              :class="fieldClass"
            />
            <select
              v-else
              v-model="condition.operatorTarget"
              :class="fieldClass"
            >
              <option
                v-for="opt in conditionEnumOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <p v-if="selectedSensor?.unit" class="text-xs text-muted">
              Unit: {{ selectedSensor.unit }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-surface border border-border rounded-2xl p-4 md:p-6">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-primary">Actions</h2>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted hover:text-primary hover:border-primary transition disabled:opacity-50"
            :disabled="!canAddAction"
            @click="addAction"
          >
            Add action
          </button>
        </div>

        <p v-if="components.length === 0" class="text-sm text-muted">
          No components available yet.
        </p>

        <div
          v-for="action in actions"
          :key="action.id"
          class="flex flex-col gap-3"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-primary">Component</label>
              <select
                v-model="action.componentId"
                :class="fieldClass"
                @change="handleComponentSelection(action)"
              >
                <option value="" disabled>Select component</option>
                <option
                  v-for="comp in availableComponents(action.id)"
                  :key="comp.id"
                  :value="comp.id"
                >
                  {{ comp.name }}
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm text-primary">Action</label>
              <select
                v-model="action.command"
                :class="fieldClass"
                :disabled="!action.componentType"
                @change="handleCommandSelection(action)"
              >
                <option value="" disabled>Select action</option>
                <option
                  v-for="opt in getActionOptions(action.componentType)"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm text-primary">
                {{ actionTargetLabel(action) }}
              </label>
              <input
                v-if="actionNeedsTarget(action)"
                v-model="action.targetTemp"
                type="number"
                :placeholder="actionTargetPlaceholder(action)"
                :class="fieldClass"
              />
              <div
                v-else
                class="h-[46px] px-4 flex items-center text-sm text-muted border border-border rounded-lg bg-elevated"
              >
                No parameter needed
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              class="text-xs text-muted hover:text-primary transition disabled:opacity-50"
              :disabled="actions.length === 1"
              @click="removeAction(action.id)"
            >
              Remove action
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="flex justify-end">
      <div class="w-full md:w-64">
        <BaseButton label="Save rule" :loading="saving" @click="save" />
      </div>
    </div>
  </div>
</template>
