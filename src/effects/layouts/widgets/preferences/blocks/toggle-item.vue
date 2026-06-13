<script setup lang="ts">
import type { SelectOption } from '@/types';

import { Segmented } from 'antdv-next';

defineOptions({
  name: 'PreferenceToggleItem',
});

withDefaults(defineProps<{ disabled?: boolean; items?: SelectOption[] }>(), {
  disabled: false,
  items: () => [],
});

const modelValue = defineModel<string>();
</script>

<template>
  <div
    :class="{
      'pointer-events-none opacity-50': disabled,
    }"
    class="flex w-full items-center justify-between rounded-md p-2 hover:bg-accent"
    disabled
  >
    <span class="text-sm">
      <slot></slot>
    </span>
    <Segmented v-model:value="modelValue" :options="items" />
  </div>
</template>
