<script setup lang="ts">
import { cn } from '@/core/shared/utils';

const props = withDefaults(
  defineProps<{
    class?: any;
    orientation?: 'horizontal' | 'vertical';
  }>(),
  {
    orientation: 'horizontal',
  },
);
</script>

<template>
  <div
    :class="
      cn(
        'bg-border shrink-0',
        orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        props.class,
      )
    "
  ></div>
</template>
