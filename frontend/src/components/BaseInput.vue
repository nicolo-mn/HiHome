<script setup lang="ts">
defineProps<{
  label: string;
  modelValue: string;
  placeholder?: string;
  type?: string;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <label class="text-sm text-gray-500">{{ label }}</label>
    <input
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      class="bg-white rounded-lg px-4 py-3 text-gray-700 outline-none border border-blue-100 focus:border-blue-300 transition"
    />
  </div>
</template>
