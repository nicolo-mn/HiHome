<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { componentsApi, rulesApi } from "@/api";
import { ApiError } from "@/api/errors";
import type { HomeComponent, ComponentType } from "@/api/components";
import { useAuthStore } from "@/stores/auth";
import { useAsyncAction } from "@/composables/useAsyncAction";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import BasePickerRow from "@/components/BasePickerRow.vue";
import BaseBottomSheet from "@/components/BaseBottomSheet.vue";
import { ACCENT } from "@/utils/accents";
import type { Accent, IconName } from "@/types/ui";

type OperatorOption = { value: string; label: string; symbol: string };
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
  icon: IconName;
  accent: Accent;
  defaultTarget: number | string;
};

type ActionOption = {
  value: string;
  label: string;
  needsTarget?: boolean;
  targetLabel?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultTarget?: number;
};

type ActionDraft = {
  id: string;
  componentId: string;
  componentType: ComponentType | "";
  command: string;
  targetTemp: string;
};

const numericOperators: OperatorOption[] = [
  { value: "lt", label: "is below", symbol: "<" },
  { value: "eq", label: "equals", symbol: "=" },
  { value: "gt", label: "is above", symbol: ">" },
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
    min: 5,
    max: 40,
    step: 0.5,
    unit: "°C",
    icon: "device_thermostat",
    accent: "orange",
    defaultTarget: 20,
  },
  {
    id: "external-thermometer",
    label: "External temperature",
    kind: "numeric",
    operators: numericOperators,
    min: 5,
    max: 40,
    step: 0.5,
    unit: "°C",
    icon: "device_thermostat",
    accent: "orange",
    defaultTarget: 15,
  },
  {
    id: "wind-speed",
    label: "Wind speed",
    kind: "numeric",
    operators: numericOperators,
    min: 0,
    max: 60,
    step: 0.5,
    unit: "m/s",
    icon: "airwave",
    accent: "blue",
    defaultTarget: 5,
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
    icon: "air",
    accent: "sky",
    defaultTarget: 50,
  },
  {
    id: "weather",
    label: "Weather",
    kind: "enum",
    operators: [{ value: "is", label: "is", symbol: "=" }],
    options: weatherOptions,
    icon: "cloud",
    accent: "sky",
    defaultTarget: weatherOptions[0]?.value ?? "",
  },
];

const COMPONENT_META: Record<
  ComponentType,
  { icon: IconName; accent: Accent }
> = {
  light: { icon: "bolt", accent: "yellow" },
  window: { icon: "swap", accent: "emerald" },
  thermostat: { icon: "device_thermostat", accent: "orange" },
  unknown: { icon: "info", accent: "sky" },
};

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
      unit: "°C",
      min: 14,
      max: 28,
      step: 0.5,
      defaultTarget: 21,
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
const sensorId = ref<string>(sensorOptions[0]?.id ?? "weather");
const operatorId = ref<string>(sensorOptions[0]?.operators[0]?.value ?? "is");
const target = ref<number | string>(sensorOptions[0]?.defaultTarget ?? "");

let nextActionId = 0;
const actions = ref<ActionDraft[]>([createActionDraft()]);

const sensor = computed<SensorOption>(
  () => sensorOptions.find((s) => s.id === sensorId.value) ?? sensorOptions[0]!,
);
const operator = computed<OperatorOption>(
  () =>
    sensor.value.operators.find((o) => o.value === operatorId.value) ??
    sensor.value.operators[0]!,
);

watch(sensorId, () => {
  const s = sensor.value;
  if (!s.operators.find((o) => o.value === operatorId.value)) {
    operatorId.value = s.operators[0]!.value;
  }
  target.value = s.defaultTarget;
});

const isNumericCondition = computed(() => sensor.value.kind === "numeric");

const targetDisplay = computed(() => {
  if (isNumericCondition.value) {
    return `${target.value}${sensor.value.unit ?? ""}`;
  }
  const opt = sensor.value.options?.find((o) => o.value === target.value);
  return opt?.label ?? String(target.value);
});

const usedComponentIds = computed(
  () => new Set(actions.value.map((a) => a.componentId).filter(Boolean)),
);
const canAddAction = computed(
  () => actions.value.length < components.value.length,
);
const canSave = computed(
  () =>
    ruleName.value.trim().length > 0 &&
    actions.value.length > 0 &&
    actions.value.every((a) => a.componentId && a.command),
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

function componentMeta(type: ComponentType | "") {
  if (!type) return COMPONENT_META.unknown;
  return COMPONENT_META[type];
}

function componentForAction(action: ActionDraft): HomeComponent | undefined {
  return components.value.find((c) => c.id === action.componentId);
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

function actionDef(action: ActionDraft): ActionOption | undefined {
  return getActionDefinition(action.componentType, action.command);
}

function actionLabel(action: ActionDraft): string {
  return actionDef(action)?.label ?? "Select action";
}

function actionParamDisplay(action: ActionDraft): string {
  const def = actionDef(action);
  if (!def?.needsTarget) return "";
  return `${action.targetTemp || def.defaultTarget || ""}${def.unit ?? ""}`;
}

function addAction() {
  if (!canAddAction.value) return;
  actions.value.push(createActionDraft());
}

function removeAction(actionId: string) {
  if (actions.value.length === 1) return;
  actions.value = actions.value.filter((a) => a.id !== actionId);
}

function getApiErrorMessage(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  const body = err.body as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : null;
}

const {
  run: save,
  isLoading: saving,
  error: saveError,
} = useAsyncAction(
  async () => {
    if (!homeId.value || !canSave.value) return;
    const operatorTarget = isNumericCondition.value
      ? Number(target.value)
      : String(target.value);

    await rulesApi.createRule(homeId.value, {
      ruleName: ruleName.value.trim(),
      observableId: sensorId.value,
      operator: operatorId.value,
      operatorTarget,
      actions: actions.value.map((a) => {
        const def = actionDef(a);
        const numericTarget =
          a.targetTemp !== ""
            ? Number(a.targetTemp)
            : def?.defaultTarget !== undefined
              ? Number(def.defaultTarget)
              : undefined;
        return {
          componentId: a.componentId,
          componentType: a.componentType as ComponentType,
          command: a.command,
          targetTemp: def?.needsTarget ? numericTarget : undefined,
        };
      }),
    });
    router.push({ name: "rules" });
  },
  { onError: (err) => getApiErrorMessage(err) },
);

type SheetState =
  | null
  | { kind: "sensor" }
  | { kind: "operator" }
  | { kind: "target" }
  | { kind: "component"; index: number }
  | { kind: "action"; index: number }
  | { kind: "param"; index: number };

const sheet = ref<SheetState>(null);

function pickSensor(id: string) {
  sensorId.value = id;
  sheet.value = null;
}

function pickOperator(id: string) {
  operatorId.value = id;
  sheet.value = null;
}

function pickTargetChoice(v: string) {
  target.value = v;
  sheet.value = null;
}

function stepTarget(delta: number) {
  if (!isNumericCondition.value) return;
  const s = sensor.value;
  const next = Math.max(
    s.min ?? -Infinity,
    Math.min(s.max ?? Infinity, Number(target.value) + delta),
  );
  target.value = next;
}

function onTargetInput(ev: Event) {
  target.value = Number((ev.target as HTMLInputElement).value);
}

function pickComponent(i: number, id: string) {
  const comp = components.value.find((c) => c.id === id);
  if (!comp) return;
  const opts = getActionOptions(comp.type);
  const def = opts[0];
  actions.value[i] = {
    ...actions.value[i]!,
    componentId: id,
    componentType: comp.type,
    command: def?.value ?? "",
    targetTemp:
      def?.needsTarget && def.defaultTarget !== undefined
        ? String(def.defaultTarget)
        : "",
  };
  sheet.value = null;
}

function pickActionId(i: number, id: string) {
  const a = actions.value[i]!;
  const def = getActionDefinition(a.componentType, id);
  actions.value[i] = {
    ...a,
    command: id,
    targetTemp:
      def?.needsTarget && def.defaultTarget !== undefined
        ? String(def.defaultTarget)
        : "",
  };
  sheet.value = null;
}

function stepParam(i: number, delta: number) {
  const a = actions.value[i]!;
  const def = actionDef(a);
  if (!def?.needsTarget) return;
  const current = Number(a.targetTemp || def.defaultTarget || 0);
  const next = Math.max(
    def.min ?? -Infinity,
    Math.min(def.max ?? Infinity, current + delta),
  );
  actions.value[i] = { ...a, targetTemp: String(next) };
}

function onParamInput(i: number, ev: Event) {
  const a = actions.value[i]!;
  actions.value[i] = {
    ...a,
    targetTemp: String(Number((ev.target as HTMLInputElement).value)),
  };
}

function paramValue(action: ActionDraft): number {
  const def = actionDef(action);
  if (action.targetTemp !== "") return Number(action.targetTemp);
  if (def?.defaultTarget !== undefined) return Number(def.defaultTarget);
  return 0;
}

function tintFor(accent: Accent) {
  return ACCENT[accent].tint;
}
function textFor(accent: Accent) {
  return ACCENT[accent].text;
}
function bgFor(accent: Accent) {
  return ACCENT[accent].bg;
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <AppHeader
      title="New rule"
      :large="false"
      :show-back="true"
      @back="router.push({ name: 'rules' })"
    />

    <p v-if="loadError" class="text-rose-500 text-sm">{{ loadError }}</p>
    <p v-if="saveError" class="text-rose-500 text-sm">{{ saveError }}</p>

    <div class="max-w-[720px] flex flex-col gap-7">
      <section>
        <div class="flex justify-between items-baseline mb-3">
          <span class="font-medium text-[18px] md:text-[20px] text-gray-400">
            Rule title
          </span>
          <span class="hidden sm:inline text-sm text-gray-500">
            Shown in rules list and event log
          </span>
        </div>
        <div
          class="bg-gray-700 rounded-[24px] md:rounded-[28px] px-5 md:px-6 py-4 md:py-5 flex items-center gap-3"
        >
          <BaseIcon name="bolt" :size="26" class="text-yellow-500" />
          <input
            v-model="ruleName"
            placeholder="Name this rule"
            class="flex-1 bg-transparent border-0 outline-none text-gray-200 font-bold text-[20px] md:text-[22px] leading-7 placeholder:text-gray-500 min-w-0"
          />
        </div>
      </section>

      <section>
        <div class="flex justify-between items-baseline mb-3">
          <span class="font-medium text-[18px] md:text-[20px] text-gray-400">
            When
          </span>
          <span class="hidden sm:inline text-sm text-gray-500">
            The trigger that activates this rule
          </span>
        </div>
        <div
          class="bg-gray-800/50 border-2 border-gray-800 rounded-[24px] md:rounded-[28px] p-3 md:p-4 flex flex-col gap-2"
        >
          <BasePickerRow
            prefix="Sensor"
            :icon="sensor.icon"
            :accent="sensor.accent"
            :value="sensor.label"
            @open="sheet = { kind: 'sensor' }"
          />
          <BasePickerRow
            prefix="Operator"
            icon="filter"
            accent="violet"
            :value="operator.label"
            :suffix="operator.symbol"
            @open="sheet = { kind: 'operator' }"
          />
          <BasePickerRow
            prefix="Target"
            icon="more"
            accent="lime"
            :value="targetDisplay"
            @open="sheet = { kind: 'target' }"
          />
        </div>
      </section>

      <section>
        <div class="flex justify-between items-baseline mb-3">
          <span class="font-medium text-[18px] md:text-[20px] text-gray-400">
            Then
          </span>
          <span class="text-sm text-gray-500">
            {{ actions.length }} action{{
              actions.length === 1 ? "" : "s"
            }}
            will run
          </span>
        </div>

        <p v-if="components.length === 0" class="text-sm text-gray-500 mb-3">
          No components available yet.
        </p>

        <div class="flex flex-col gap-3">
          <div
            v-for="(a, i) in actions"
            :key="a.id"
            :class="[
              'rounded-[24px] md:rounded-[28px] p-3 md:p-4 flex flex-col gap-2 relative',
              tintFor(componentMeta(a.componentType).accent),
            ]"
          >
            <div class="flex justify-between items-center px-1 pb-1">
              <span
                :class="[
                  'font-semibold text-sm uppercase tracking-wider',
                  textFor(componentMeta(a.componentType).accent),
                ]"
              >
                Action {{ i + 1 }}
              </span>
              <button
                v-if="actions.length > 1"
                type="button"
                class="w-8 h-8 rounded-2xl text-gray-400 flex items-center justify-center hover:bg-white/5"
                @click="removeAction(a.id)"
              >
                <BaseIcon name="close" :size="20" />
              </button>
            </div>
            <BasePickerRow
              prefix="Component"
              :icon="componentMeta(a.componentType).icon"
              :accent="componentMeta(a.componentType).accent"
              :value="componentForAction(a)?.name ?? 'Select component'"
              :sub="componentForAction(a)?.roomName ?? ''"
              @open="sheet = { kind: 'component', index: i }"
            />
            <BasePickerRow
              prefix="Action"
              icon="bolt"
              :accent="componentMeta(a.componentType).accent"
              :value="actionLabel(a)"
              @open="a.componentId && (sheet = { kind: 'action', index: i })"
            />
            <BasePickerRow
              v-if="actionDef(a)?.needsTarget"
              prefix="Parameter"
              icon="more"
              :accent="componentMeta(a.componentType).accent"
              :value="actionParamDisplay(a)"
              @open="sheet = { kind: 'param', index: i }"
            />
          </div>

          <button
            type="button"
            :disabled="!canAddAction"
            class="h-14 rounded-[24px] md:rounded-[28px] border-2 border-dashed border-gray-800 text-gray-300 font-semibold text-base md:text-lg flex items-center justify-center gap-2 hover:bg-white/[0.02] disabled:opacity-40 disabled:cursor-not-allowed"
            @click="addAction"
          >
            <BaseIcon name="add" :size="22" />
            Add another action
          </button>
        </div>
      </section>

      <div class="flex gap-3 mt-2">
        <button
          type="button"
          class="flex-1 h-16 rounded-[28px] md:rounded-[32px] bg-gray-800/50 border-2 border-gray-800 text-gray-200 font-semibold text-[18px] md:text-[20px]"
          @click="router.push({ name: 'rules' })"
        >
          Cancel
        </button>
        <button
          type="button"
          :disabled="!canSave || saving"
          :class="[
            'flex-[2] h-16 rounded-[28px] md:rounded-[32px] font-bold text-[18px] md:text-[20px] flex items-center justify-center gap-2',
            canSave && !saving
              ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
              : 'bg-yellow-500/20 text-gray-400 cursor-not-allowed',
          ]"
          @click="save"
        >
          <BaseIcon name="check" :size="22" />
          {{ saving ? "Saving…" : "Save rule" }}
        </button>
      </div>

      <div class="h-12" />
    </div>

    <BaseBottomSheet v-if="sheet" @close="sheet = null">
      <template v-if="sheet?.kind === 'sensor'">
        <div class="font-bold text-2xl mb-3 text-gray-200">Choose a sensor</div>
        <div
          class="flex flex-col gap-1.5 overflow-y-auto"
          style="max-height: 60vh"
        >
          <button
            v-for="s in sensorOptions"
            :key="s.id"
            type="button"
            :class="[
              'flex items-center gap-3.5 p-3.5 rounded-[18px] text-left transition-colors',
              s.id === sensorId ? 'bg-white/5' : 'hover:bg-white/[0.02]',
            ]"
            @click="pickSensor(s.id)"
          >
            <div
              class="w-11 h-11 rounded-2xl bg-gray-900/60 flex items-center justify-center"
              :class="textFor(s.accent)"
            >
              <BaseIcon :name="s.icon" :size="22" />
            </div>
            <div class="flex-1">
              <div class="text-[18px] font-semibold text-gray-200">
                {{ s.label }}
              </div>
              <div class="text-sm text-gray-400 mt-0.5">
                {{ s.kind === "numeric" ? "Numeric value" : "Categorical" }}
              </div>
            </div>
            <BaseIcon
              v-if="s.id === sensorId"
              name="check"
              :size="24"
              :class="textFor(s.accent)"
            />
          </button>
        </div>
      </template>

      <template v-else-if="sheet?.kind === 'operator'">
        <div class="font-bold text-2xl mb-3 text-gray-200">
          Choose an operator
        </div>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="o in sensor.operators"
            :key="o.value"
            type="button"
            :class="[
              'flex items-center gap-3.5 p-3.5 rounded-[18px] text-left transition-colors',
              o.value === operatorId ? 'bg-white/5' : 'hover:bg-white/[0.02]',
            ]"
            @click="pickOperator(o.value)"
          >
            <div
              class="w-11 h-11 rounded-2xl bg-gray-900/60 flex items-center justify-center text-violet-500"
            >
              <BaseIcon name="filter" :size="22" />
            </div>
            <div class="flex-1">
              <div class="text-[18px] font-semibold text-gray-200">
                {{ o.label }}
              </div>
              <div class="text-sm text-gray-400 mt-0.5 font-mono">
                {{ o.symbol }}
              </div>
            </div>
            <BaseIcon
              v-if="o.value === operatorId"
              name="check"
              :size="24"
              class="text-violet-500"
            />
          </button>
        </div>
      </template>

      <template v-else-if="sheet?.kind === 'target'">
        <template v-if="isNumericCondition">
          <div class="font-bold text-2xl mb-4 text-gray-200">
            Target {{ sensor.label.toLowerCase() }}
          </div>
          <div
            class="flex flex-col items-center gap-4 px-4 py-6 rounded-3xl bg-gray-900/50"
          >
            <div
              :class="[
                'font-bold text-[64px] leading-[68px]',
                textFor(sensor.accent),
              ]"
            >
              {{ target
              }}<span class="text-[28px] text-gray-400 ml-1.5">{{
                sensor.unit
              }}</span>
            </div>
            <div class="flex gap-3 items-center w-full max-w-[420px]">
              <button
                type="button"
                class="w-11 h-11 rounded-2xl bg-white/[0.08] flex items-center justify-center shrink-0 text-gray-200"
                @click="stepTarget(-(sensor.step ?? 1))"
              >
                <BaseIcon name="close" :size="20" />
              </button>
              <input
                type="range"
                :min="sensor.min"
                :max="sensor.max"
                :step="sensor.step"
                :value="target"
                class="flex-1"
                @input="onTargetInput"
              />
              <button
                type="button"
                class="w-11 h-11 rounded-2xl bg-white/[0.08] flex items-center justify-center shrink-0 text-gray-200"
                @click="stepTarget(sensor.step ?? 1)"
              >
                <BaseIcon name="add" :size="20" />
              </button>
            </div>
            <div class="text-sm text-gray-400">
              Range: {{ sensor.min }}{{ sensor.unit }} – {{ sensor.max
              }}{{ sensor.unit }}
            </div>
          </div>
          <button
            type="button"
            :class="[
              'mt-4 w-full h-14 rounded-[24px] text-gray-900 font-bold text-lg',
              bgFor(sensor.accent),
            ]"
            @click="sheet = null"
          >
            Done
          </button>
        </template>
        <template v-else>
          <div class="font-bold text-2xl mb-3 text-gray-200">Choose target</div>
          <div class="flex flex-col gap-1.5">
            <button
              v-for="o in sensor.options ?? []"
              :key="o.value"
              type="button"
              :class="[
                'flex items-center gap-3.5 p-3.5 rounded-[18px] text-left transition-colors',
                o.value === target ? 'bg-white/5' : 'hover:bg-white/[0.02]',
              ]"
              @click="pickTargetChoice(o.value)"
            >
              <div
                class="w-11 h-11 rounded-2xl bg-gray-900/60 flex items-center justify-center"
                :class="textFor(sensor.accent)"
              >
                <BaseIcon name="check" :size="22" />
              </div>
              <div class="flex-1 text-[18px] font-semibold text-gray-200">
                {{ o.label }}
              </div>
              <BaseIcon
                v-if="o.value === target"
                name="check"
                :size="24"
                :class="textFor(sensor.accent)"
              />
            </button>
          </div>
        </template>
      </template>

      <template v-else-if="sheet?.kind === 'component'">
        <div class="font-bold text-2xl mb-3 text-gray-200">
          Choose a component
        </div>
        <div
          class="flex flex-col gap-1.5 overflow-y-auto"
          style="max-height: 60vh"
        >
          <button
            v-for="c in availableComponents(actions[sheet.index]!.id)"
            :key="c.id"
            type="button"
            :class="[
              'flex items-center gap-3.5 p-3.5 rounded-[18px] text-left transition-colors',
              c.id === actions[sheet.index]!.componentId
                ? 'bg-white/5'
                : 'hover:bg-white/[0.02]',
            ]"
            @click="pickComponent(sheet.index, c.id)"
          >
            <div
              class="w-11 h-11 rounded-2xl bg-gray-900/60 flex items-center justify-center"
              :class="textFor(componentMeta(c.type).accent)"
            >
              <BaseIcon :name="componentMeta(c.type).icon" :size="22" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[18px] font-semibold text-gray-200 truncate">
                {{ c.name }}
              </div>
              <div class="text-sm text-gray-400 mt-0.5 truncate">
                {{ c.roomName ?? "—" }}
              </div>
            </div>
            <BaseIcon
              v-if="c.id === actions[sheet.index]!.componentId"
              name="check"
              :size="24"
              :class="textFor(componentMeta(c.type).accent)"
            />
          </button>
        </div>
      </template>

      <template v-else-if="sheet?.kind === 'action'">
        <div class="font-bold text-2xl mb-3 text-gray-200">
          Choose an action
        </div>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="o in getActionOptions(actions[sheet.index]!.componentType)"
            :key="o.value"
            type="button"
            :class="[
              'flex items-center gap-3.5 p-3.5 rounded-[18px] text-left transition-colors',
              o.value === actions[sheet.index]!.command
                ? 'bg-white/5'
                : 'hover:bg-white/[0.02]',
            ]"
            @click="pickActionId(sheet.index, o.value)"
          >
            <div
              class="w-11 h-11 rounded-2xl bg-gray-900/60 flex items-center justify-center"
              :class="
                textFor(
                  componentMeta(actions[sheet.index]!.componentType).accent,
                )
              "
            >
              <BaseIcon name="bolt" :size="22" />
            </div>
            <div class="flex-1">
              <div class="text-[18px] font-semibold text-gray-200">
                {{ o.label }}
              </div>
              <div class="text-sm text-gray-400 mt-0.5">
                {{ o.needsTarget ? "Requires parameter" : "No parameter" }}
              </div>
            </div>
            <BaseIcon
              v-if="o.value === actions[sheet.index]!.command"
              name="check"
              :size="24"
              :class="
                textFor(
                  componentMeta(actions[sheet.index]!.componentType).accent,
                )
              "
            />
          </button>
        </div>
      </template>

      <template v-else-if="sheet?.kind === 'param'">
        <div class="font-bold text-2xl mb-4 text-gray-200">
          {{ actionDef(actions[sheet.index]!)?.label }}
        </div>
        <div
          class="flex flex-col items-center gap-4 px-4 py-6 rounded-3xl bg-gray-900/50"
        >
          <div
            :class="[
              'font-bold text-[64px] leading-[68px]',
              textFor(
                componentMeta(actions[sheet.index]!.componentType).accent,
              ),
            ]"
          >
            {{ paramValue(actions[sheet.index]!)
            }}<span class="text-[28px] text-gray-400 ml-1.5">{{
              actionDef(actions[sheet.index]!)?.unit ?? ""
            }}</span>
          </div>
          <div class="flex gap-3 items-center w-full max-w-[420px]">
            <button
              type="button"
              class="w-11 h-11 rounded-2xl bg-white/[0.08] flex items-center justify-center shrink-0 text-gray-200"
              @click="
                stepParam(
                  sheet.index,
                  -(actionDef(actions[sheet.index]!)?.step ?? 1),
                )
              "
            >
              <BaseIcon name="close" :size="20" />
            </button>
            <input
              type="range"
              :min="actionDef(actions[sheet.index]!)?.min"
              :max="actionDef(actions[sheet.index]!)?.max"
              :step="actionDef(actions[sheet.index]!)?.step"
              :value="paramValue(actions[sheet.index]!)"
              class="flex-1"
              @input="
                (ev) => onParamInput((sheet as { index: number }).index, ev)
              "
            />
            <button
              type="button"
              class="w-11 h-11 rounded-2xl bg-white/[0.08] flex items-center justify-center shrink-0 text-gray-200"
              @click="
                stepParam(
                  sheet.index,
                  actionDef(actions[sheet.index]!)?.step ?? 1,
                )
              "
            >
              <BaseIcon name="add" :size="20" />
            </button>
          </div>
        </div>
        <button
          type="button"
          :class="[
            'mt-4 w-full h-14 rounded-[24px] text-gray-900 font-bold text-lg',
            bgFor(componentMeta(actions[sheet.index]!.componentType).accent),
          ]"
          @click="sheet = null"
        >
          Done
        </button>
      </template>
    </BaseBottomSheet>
  </div>
</template>
