<script setup lang="ts">
import type { StyleValue } from 'vue';

import type { ClassType } from '@vben-core/typings';

import { Tooltip } from 'antdv-next';

interface Props {
  contentClass?: ClassType;
  contentStyle?: StyleValue;
  delayDuration?: number;
  side?: 'bottom' | 'left' | 'right' | 'top';
}

withDefaults(defineProps<Props>(), {
  delayDuration: 0,
  side: 'right',
});
</script>

<template>
  <Tooltip
    :placement="side"
    :mouse-enter-delay="(delayDuration || 0) / 1000"
    :overlay-class-name="contentClass as string"
    :overlay-style="contentStyle"
  >
    <template #title>
      <slot></slot>
    </template>
    <slot name="trigger"></slot>
  </Tooltip>
</template>
