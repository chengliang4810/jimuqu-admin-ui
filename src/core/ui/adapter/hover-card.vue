<script setup lang="ts">
import type { ClassType } from '@/types';

import { Popover } from 'antdv-next';

interface Props {
  class?: ClassType;
  closeDelay?: number;
  contentClass?: ClassType;
  openDelay?: number;
}

withDefaults(defineProps<Props>(), {
  openDelay: 100,
  closeDelay: 100,
});
</script>

<template>
  <Popover
    trigger="hover"
    :mouse-enter-delay="(openDelay || 0) / 1000"
    :mouse-leave-delay="(closeDelay || 0) / 1000"
    :overlay-class-name="contentClass as string"
    :arrow="false"
  >
    <template #content>
      <slot></slot>
    </template>
    <div class="h-full cursor-pointer">
      <slot name="trigger"></slot>
    </div>
  </Popover>
</template>
