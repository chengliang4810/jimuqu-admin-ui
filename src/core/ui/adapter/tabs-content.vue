<script setup lang="ts">
import { computed, inject } from 'vue';

import { cn } from '@/utils';

import { tabsContextKey } from './tabs-context';

const props = defineProps<{
  class?: any;
  value: number | string;
}>();

const context = inject(tabsContextKey);
const isActive = computed(() => context?.activeValue.value === props.value);
</script>

<template>
  <div
    v-show="isActive"
    :class="
      cn(
        'ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden',
        props.class,
      )
    "
    :data-state="isActive ? 'active' : 'inactive'"
    role="tabpanel"
  >
    <slot></slot>
  </div>
</template>
