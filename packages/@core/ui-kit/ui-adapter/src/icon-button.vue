<script setup lang="ts">
import { computed, useSlots } from 'vue';

import { cn } from '@vben-core/shared/utils';

import { Button } from 'antdv-next';

import VbenTooltip from './tooltip.vue';

interface Props {
  class?: any;
  disabled?: boolean;
  onClick?: () => void;
  tooltip?: string;
  tooltipDelayDuration?: number;
  tooltipSide?: 'bottom' | 'left' | 'right' | 'top';
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  onClick: () => {},
  tooltipDelayDuration: 200,
  tooltipSide: 'bottom',
});

const slots = useSlots();
const showTooltip = computed(() => !!slots.tooltip || !!props.tooltip);
</script>

<template>
  <Button
    v-if="!showTooltip"
    type="text"
    shape="circle"
    :disabled="disabled"
    :class="cn('flex-center', props.class)"
    @click="onClick"
  >
    <slot></slot>
  </Button>

  <VbenTooltip
    v-else
    :delay-duration="tooltipDelayDuration"
    :side="tooltipSide"
  >
    <template #trigger>
      <Button
        type="text"
        shape="circle"
        :disabled="disabled"
        :class="cn('flex-center', props.class)"
        @click="onClick"
      >
        <slot></slot>
      </Button>
    </template>
    <slot v-if="slots.tooltip" name="tooltip"></slot>
    <template v-else>{{ tooltip }}</template>
  </VbenTooltip>
</template>
