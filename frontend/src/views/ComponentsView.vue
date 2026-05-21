<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useComponentsStore } from "@/stores/components";
import { useRoomGroups } from "@/composables/useRoomGroups";
import { useAsyncAction } from "@/composables/useAsyncAction";
import { ApiError } from "@/api/errors";
import type { ToggleableType } from "@/api/components";
import ComponentCard from "@/components/cards/ComponentCard.vue";
import AddComponentCard from "@/components/cards/AddComponentCard.vue";
import BaseButton from "@/components/BaseButton.vue";
import BaseInput from "@/components/BaseInput.vue";

const store = useComponentsStore();
const { components, isLoading, error } = storeToRefs(store);
const { load, toggle, step, isBusy, addComponent } = store;

const roomGroups = useRoomGroups(components);

const fieldClass =
  "bg-elevated rounded-lg px-4 py-3 text-body placeholder:text-muted outline-none border border-border focus:border-primary transition";

const typeOptions: { value: ToggleableType; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "window", label: "Window" },
];

const addFormOpen = ref(false);
const draftName = ref("");
const draftType = ref<ToggleableType>("light");
const roomSelection = ref("");

function formatRoomLabel(roomId: string): string {
  return roomId
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const roomOptions = computed(() => {
  const map = new Map<string, string>();
  for (const comp of components.value) {
    if (comp.roomId) {
      map.set(comp.roomId, formatRoomLabel(comp.roomId));
    }
  }
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
});

const roomSelectOptions = computed(() => roomOptions.value);

const hasRooms = computed(() => roomSelectOptions.value.length > 0);

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

function onAddComponentClick(roomId: string) {
  openAddComponent(roomId);
}

onMounted(load);
</script>

<template>
  <div class="flex flex-col gap-6">
    <section class="bg-surface border border-border rounded-2xl p-4 md:p-6">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-medium text-primary">Add component</h2>
        <button
          type="button"
          class="text-sm text-muted hover:text-primary transition"
          @click="addFormOpen ? closeAddComponent() : openAddComponent()"
        >
          {{ addFormOpen ? "Close" : "Open" }}
        </button>
      </div>

      <div v-if="addFormOpen" class="mt-4 flex flex-col gap-4">
        <p v-if="createError" class="text-danger text-sm">{{ createError }}</p>
        <p v-if="!hasRooms" class="text-muted text-sm">
          Add a room before creating components.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <BaseInput label="Component name" v-model="draftName" />

          <div class="flex flex-col gap-1">
            <label class="text-sm text-primary">Type</label>
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

          <div class="flex flex-col gap-1">
            <label class="text-sm text-primary">Room</label>
            <select
              v-model="roomSelection"
              :class="fieldClass"
              :disabled="!hasRooms"
            >
              <option
                v-for="room in roomSelectOptions"
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
      </div>
    </section>

    <div v-if="error && components.length === 0" class="flex flex-col gap-2">
      <p class="text-danger text-sm">{{ error }}</p>
      <BaseButton label="Retry" @click="load" />
    </div>
    <p v-else-if="error" class="text-danger text-sm">{{ error }}</p>

    <div v-if="isLoading && components.length === 0" class="text-muted text-sm">
      Loading components…
    </div>

    <section
      v-for="group in roomGroups"
      :key="group.roomId"
      class="flex flex-col gap-3"
    >
      <h2 class="text-xl font-light text-primary">{{ group.label }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ComponentCard
          v-for="item in group.items"
          :key="item.id"
          :component="item"
          :busy="isBusy(item.id)"
          @toggle="toggle"
          @step="step"
        />
        <AddComponentCard
          :disabled="creating || !hasRooms"
          @click="onAddComponentClick(group.roomId)"
        />
      </div>
    </section>
  </div>
</template>
