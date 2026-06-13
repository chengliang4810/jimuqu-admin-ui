<script setup lang="ts">
import type { ClassType } from '@/core/typings';

import { Popover } from 'antdv-next';

interface Props {
  class?: ClassType;
  contentClass?: ClassType;
  triggerClass?: ClassType;
}

defineProps<Props>();

const open = defineModel<boolean>('open');
</script>

<template>
  <Popover
    v-model:open="open"
    trigger="click"
    :overlay-class-name="contentClass as string"
    :arrow="false"
  >
    <template #content>
      <slot></slot>
    </template>
    <span :class="triggerClass">
      <slot name="trigger"></slot>
    </span>
  </Popover>
</template>
