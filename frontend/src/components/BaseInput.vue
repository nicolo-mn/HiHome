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
  <div class="flex flex-col gap-1.5">
    <label
      class="text-[12px] md:text-[13px] font-medium uppercase tracking-wider text-gray-400"
    >
      {{ label }}
    </label>
    <input
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      @input="
        $emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      class="bg-gray-800/50 rounded-2xl px-5 py-3.5 text-gray-200 text-[16px] md:text-[17px] placeholder:text-gray-600 outline-none border-2 border-gray-800 focus:border-yellow-500 transition-colors min-w-0"
    />
  </div>
</template>
