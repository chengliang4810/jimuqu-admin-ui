<script setup lang="ts">
import { computed, inject } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { tabsContextKey } from './tabs-context';

const props = withDefaults(
  defineProps<{
    class?: any;
    disabled?: boolean;
    value: number | string;
  }>(),
  {
    disabled: false,
  },
);

const context = inject(tabsContextKey);
const isActive = computed(() => context?.activeValue.value === props.value);

function handleClick() {
  if (props.disabled) {
    return;
  }

  context?.setActiveValue(props.value);
}
</script>

<template>
  <button
    :aria-selected="isActive"
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm',
        props.class,
      )
    "
    :data-state="isActive ? 'active' : 'inactive'"
    :disabled="disabled"
    role="tab"
    type="button"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>
