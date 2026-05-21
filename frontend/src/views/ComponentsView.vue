<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useComponentsStore } from "@/stores/components";
import { useRoomGroups } from "@/composables/useRoomGroups";
import ComponentCard from "@/components/cards/ComponentCard.vue";
import AddComponentCard from "@/components/cards/AddComponentCard.vue";
import BaseButton from "@/components/BaseButton.vue";

const store = useComponentsStore();
const { components, isLoading, error } = storeToRefs(store);
const { load, toggle, step, isBusy } = store;

const roomGroups = useRoomGroups(components);

function onAddComponentClick(roomId: string) {
  // TODO: open an add-component dialog scoped to roomId.
  void roomId;
}

onMounted(load);
</script>

<template>
  <div class="flex flex-col gap-6">
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
        <AddComponentCard disabled @click="onAddComponentClick(group.roomId)" />
      </div>
    </section>
  </div>
</template>
