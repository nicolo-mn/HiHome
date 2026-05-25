<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useComponentsStore } from "@/stores/components";
import { useRoomGroups } from "@/composables/useRoomGroups";
import { useAsyncAction } from "@/composables/useAsyncAction";
import { ApiError } from "@/api/errors";
import type { ToggleableType } from "@/api/components";
import AppHeader from "@/components/AppHeader.vue";
import BaseIcon from "@/components/BaseIcon.vue";
import ComponentCard from "@/components/cards/ComponentCard.vue";
import AddComponentCard from "@/components/cards/AddComponentCard.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseInput from "@/components/BaseInput.vue";

const auth = useAuthStore();
const store = useComponentsStore();
const { components, isLoading, error } = storeToRefs(store);
const { load, toggle, step, isBusy, addComponent } = store;

const roomGroups = useRoomGroups(components);

const fieldClass =
  "bg-gray-800/50 rounded-2xl px-5 py-3.5 text-gray-200 placeholder:text-gray-600 outline-none border-2 border-gray-800 focus:border-yellow-500 transition-colors";

const typeOptions: { value: ToggleableType; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "window", label: "Window" },
];

const addFormOpen = ref(false);
const draftName = ref("");
const draftType = ref<ToggleableType>("light");
const roomSelection = ref("");

const roomOptions = computed(() => {
  const map = new Map<string, string>();
  for (const comp of components.value) {
    if (comp.roomId) {
      map.set(comp.roomId, comp.roomName ?? comp.roomId);
    }
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
});

const hasRooms = computed(() => roomOptions.value.length > 0);

const canSubmit = computed(
  () => draftName.value.trim().length > 0 && roomSelection.value.length > 0,
);

watch(
  () => roomOptions.value,
  (rooms) => {
    const stillValid = rooms.some((room) => room.value === roomSelection.value);
    if (!stillValid) {
      roomSelection.value = rooms[0]?.value ?? "";
    }
  },
  { immediate: true },
);

function getApiErrorMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  const body = error.body as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : null;
}

const {
  run: createComponent,
  isLoading: creating,
  error: createError,
  reset: resetCreateError,
} = useAsyncAction(
  async () => {
    const roomId = roomSelection.value;
    if (!roomId) return;
    await addComponent({
      name: draftName.value.trim(),
      type: draftType.value,
      roomId,
    });
    draftName.value = "";
    draftType.value = "light";
    setDefaultRoomSelection();
    addFormOpen.value = false;
  },
  {
    onError: (err) => getApiErrorMessage(err),
  },
);

function setDefaultRoomSelection() {
  roomSelection.value = roomOptions.value[0]?.value ?? "";
}

function openAddComponent(roomId?: string) {
  resetCreateError();
  addFormOpen.value = true;
  if (roomId && roomOptions.value.some((room) => room.value === roomId)) {
    roomSelection.value = roomId;
    return;
  }
  setDefaultRoomSelection();
}

function closeAddComponent() {
  addFormOpen.value = false;
  resetCreateError();
  draftName.value = "";
  draftType.value = "light";
  setDefaultRoomSelection();
}

onMounted(() => {
  load();
});
</script>

<template>
  <div class="flex flex-col gap-10 md:gap-12">
    <AppHeader
      title="Components"
      :right-actions="
        auth.isAdmin
          ? [{ icon: addFormOpen ? 'close' : 'add', label: 'Add component' }]
          : []
      "
      @action="addFormOpen ? closeAddComponent() : openAddComponent()"
    />

    <section
      v-if="auth.isAdmin && addFormOpen"
      class="bg-gray-800/50 border-2 border-gray-800 rounded-[28px] md:rounded-[32px] p-5 md:p-6 flex flex-col gap-4"
    >
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg md:text-xl font-bold text-gray-200">
          Add component
        </h2>
        <button
          type="button"
          class="w-9 h-9 rounded-2xl text-gray-400 hover:bg-white/5 flex items-center justify-center"
          @click="closeAddComponent"
        >
          <BaseIcon name="close" :size="20" />
        </button>
      </div>

      <p v-if="createError" class="text-rose-500 text-sm">{{ createError }}</p>
      <p v-if="!hasRooms" class="text-gray-400 text-sm">
        Add a room before creating components.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <BaseInput label="Component name" v-model="draftName" />

        <div class="flex flex-col gap-1.5">
          <label
            class="text-[12px] md:text-[13px] font-medium uppercase tracking-wider text-gray-400"
          >
            Type
          </label>
          <select v-model="draftType" :class="fieldClass">
            <option
              v-for="opt in typeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            class="text-[12px] md:text-[13px] font-medium uppercase tracking-wider text-gray-400"
          >
            Room
          </label>
          <select
            v-model="roomSelection"
            :class="fieldClass"
            :disabled="!hasRooms"
          >
            <option
              v-for="room in roomOptions"
              :key="room.value"
              :value="room.value"
            >
              {{ room.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex justify-end">
        <div class="w-full md:w-64">
          <BaseButton
            label="Add component"
            :loading="creating"
            :disabled="!canSubmit || !hasRooms"
            @click="createComponent"
          />
        </div>
      </div>
    </section>

    <div v-if="error && components.length === 0" class="flex flex-col gap-2">
      <p class="text-rose-500 text-sm">{{ error }}</p>
      <BaseButton label="Retry" variant="secondary" @click="load" />
    </div>
    <p v-else-if="error" class="text-rose-500 text-sm">{{ error }}</p>

    <p
      v-if="isLoading && components.length === 0"
      class="text-gray-400 text-sm"
    >
      Loading components…
    </p>

    <section
      v-for="group in roomGroups"
      :key="group.roomId"
      class="flex flex-col gap-3"
    >
      <div class="flex items-center gap-3">
        <div class="font-medium text-[18px] md:text-[20px] text-gray-400">
          {{ group.label }}
        </div>
        <span class="text-sm text-gray-500">
          {{ group.items.length }} component{{
            group.items.length === 1 ? "" : "s"
          }}
        </span>
      </div>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3"
      >
        <ComponentCard
          v-for="item in group.items"
          :key="item.id"
          :component="item"
          :busy="isBusy(item.id)"
          @toggle="toggle"
          @step="step"
        />
        <AddComponentCard
          v-if="auth.isAdmin"
          :disabled="creating || !hasRooms"
          @click="openAddComponent(group.roomId)"
        />
      </div>
    </section>

    <div class="h-8" />
  </div>
</template>
