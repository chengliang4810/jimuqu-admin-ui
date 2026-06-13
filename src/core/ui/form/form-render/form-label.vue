<script setup lang="ts">
import type { CustomRenderType } from '../types';

import { cn } from '@/core/shared/utils';

import { Tooltip } from 'antdv-next';

import RenderContent from '../components/render-content';

interface Props {
  class?: string;
  colon?: boolean;
  help?: CustomRenderType;
  label?: CustomRenderType;
  required?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <label :class="cn('flex items-center', props.class)">
    <span v-if="required" class="text-destructive mr-0.5">*</span>
    <slot></slot>
    <Tooltip v-if="help">
      <template #title>
        <RenderContent :content="help" />
      </template>
      <span
        class="text-muted-foreground ml-1 inline-flex size-3.5 cursor-help items-center justify-center rounded-full border text-[10px] leading-none"
      >
        ?
      </span>
    </Tooltip>
    <slot name="extra"></slot>
    <span v-if="colon && label" class="ml-0.5">:</span>
  </label>
</template>
