<script setup lang="ts">
defineEmits<{ (e: "close"): void }>();
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex flex-col justify-end md:items-center md:justify-center md:p-8"
    @click="$emit('close')"
  >
    <div
      class="bg-gray-800 rounded-t-[32px] md:rounded-[28px] md:w-full md:max-w-[520px] md:max-h-[80vh] px-5 md:px-6 pt-4 pb-7 md:pb-6 max-h-[85vh] flex flex-col shadow-2xl"
      @click.stop
    >
      <div
        class="w-14 h-1.5 rounded-full bg-gray-500 self-center mb-4 md:hidden"
      />
      <slot />
    </div>
  </div>
</template>
