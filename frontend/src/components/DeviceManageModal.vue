<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { HomeDevice } from "@/api/devices";
import { rulesApi } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useDevicesStore } from "@/stores/devices";
import { useAsyncAction } from "@/composables/useAsyncAction";
import { ApiError } from "@/api/errors";
import BaseIcon from "./BaseIcon.vue";
import BaseInput from "./BaseInput.vue";
import BaseButton from "./BaseButton.vue";
import ErrorBanner from "./ErrorBanner.vue";

const props = defineProps<{ device: HomeDevice }>();
const emit = defineEmits<{ (e: "close"): void }>();

const auth = useAuthStore();
const store = useDevicesStore();

const name = ref(props.device.name);
const confirmingDelete = ref(false);
const usedByRules = ref<string[]>([]);
const rulesLoading = ref(true);

const canSave = computed(() => {
  const trimmed = name.value.trim();
  return trimmed.length > 0 && trimmed !== props.device.name;
});
const blockedByRules = computed(() => usedByRules.value.length > 0);

function apiErrorMessage(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  const body = err.body as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : null;
}

onMounted(async () => {
  if (!auth.homeId) {
    rulesLoading.value = false;
    return;
  }
  try {
    const rules = await rulesApi.getRules(auth.homeId);
    usedByRules.value = rules
      .filter((rule) =>
        rule.actions.some((a) => a.deviceId === props.device.id),
      )
      .map((rule) => rule.name);
  } catch {
    // If rules can't be loaded we leave delete enabled; the backend owns deletion.
  } finally {
    rulesLoading.value = false;
  }
});

const {
  run: save,
  isLoading: saving,
  error: saveError,
} = useAsyncAction(
  async () => {
    await store.renameDevice(props.device.id, name.value.trim());
    emit("close");
  },
  { onError: apiErrorMessage, action: "rename the device" },
);

const {
  run: remove,
  isLoading: deleting,
  error: deleteError,
} = useAsyncAction(
  async () => {
    await store.deleteDevice(props.device.id);
    emit("close");
  },
  { onError: apiErrorMessage, action: "delete the device" },
);
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6"
    @click.self="emit('close')"
  >
    <div
      class="bg-gray-800 rounded-[28px] md:rounded-[32px] p-6 md:p-7 w-full max-w-[420px] shadow-2xl flex flex-col gap-5"
    >
      <div class="flex items-start justify-between">
        <h2 class="text-xl md:text-2xl font-bold text-gray-200">
          Manage device
        </h2>
        <button
          type="button"
          class="w-9 h-9 rounded-2xl text-white hover:bg-white/5 flex items-center justify-center"
          @click="emit('close')"
        >
          <BaseIcon name="close" :size="20" />
        </button>
      </div>

      <div class="flex flex-col gap-4">
        <BaseInput label="Device name" v-model="name" accent-border />
        <ErrorBanner v-if="saveError" :error="saveError" />
        <BaseButton
          label="Save"
          :loading="saving"
          :disabled="!canSave"
          @click="save"
        />
      </div>

      <div class="h-px bg-white/10" />

      <div class="flex flex-col gap-3">
        <ErrorBanner
          v-if="blockedByRules"
          severity="warning"
          :error="`Used by ${usedByRules.length} rule${usedByRules.length === 1 ? '' : 's'}: ${usedByRules.join(', ')}. Remove it from those rules before deleting.`"
        />
        <ErrorBanner v-else-if="deleteError" :error="deleteError" />

        <template v-if="!confirmingDelete">
          <BaseButton
            label="Delete device"
            variant="danger"
            :disabled="rulesLoading || blockedByRules"
            @click="confirmingDelete = true"
          />
        </template>
        <template v-else>
          <p class="text-[15px] text-gray-300">
            Delete “{{ device.name }}”? This cannot be undone.
          </p>
          <div class="flex gap-3">
            <BaseButton
              label="Cancel"
              variant="secondary"
              @click="confirmingDelete = false"
            />
            <BaseButton
              label="Delete"
              variant="danger"
              :loading="deleting"
              @click="remove"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
