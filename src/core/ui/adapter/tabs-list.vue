<script setup lang="ts">
import { cn } from '@/utils';

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
        'bg-muted text-muted-foreground inline-flex min-h-9 items-center justify-center rounded-md p-1',
        props.orientation === 'vertical' ? 'flex-col' : '',
        props.class,
      )
    "
    role="tablist"
  >
    <slot></slot>
  </div>
</template>
