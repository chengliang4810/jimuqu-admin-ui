<script setup lang="ts">
import { cn } from '@/core/shared/utils';

import VbenIcon from './icon.vue';
import VbenTooltip from './tooltip.vue';

defineOptions({
  inheritAttrs: false,
});

defineProps<{ triggerClass?: string }>();
</script>

<template>
  <VbenTooltip :delay-duration="300" side="top">
    <template #trigger>
      <slot name="trigger">
        <VbenIcon
          :class="
            cn(
              'text-foreground/80 hover:text-foreground inline-flex size-5 cursor-pointer',
              triggerClass,
            )
          "
          icon="mdi:help-circle-outline"
        />
      </slot>
    </template>
    <slot></slot>
  </VbenTooltip>
</template>
