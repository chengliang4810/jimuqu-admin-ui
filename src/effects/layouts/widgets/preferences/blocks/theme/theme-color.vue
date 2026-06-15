<script setup lang="ts">
import { computed } from 'vue';

import { TinyColor } from '@/utils';
import { ColorPicker } from 'antdv-next';

defineOptions({
  name: 'PreferenceThemeColor',
});

defineProps<{ label: string }>();

const modelValue = defineModel<string>({ default: '' });

const colorValue = computed(() => {
  return new TinyColor(modelValue.value || '').toHexString();
});

function handleChange(_value: unknown, css: string) {
  modelValue.value = new TinyColor(css).toHexString();
}
</script>

<template>
  <div
    class="hover:bg-accent my-1 flex w-full items-center justify-between rounded-md px-2 py-2.5"
  >
    <span class="text-sm">
      {{ label }}
    </span>
    <div class="flex items-center gap-2">
      <span class="text-muted-foreground font-mono text-xs uppercase">
        {{ colorValue }}
      </span>
      <ColorPicker
        :value="colorValue"
        disabled-alpha
        disabled-format
        size="small"
        @change="handleChange"
      />
    </div>
  </div>
</template>
