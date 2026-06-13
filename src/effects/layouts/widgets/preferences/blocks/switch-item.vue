<script setup lang="ts">
import { useSlots } from 'vue';

import { CircleHelp } from '@/icons-app';

import { VbenTooltip } from '@/core/ui/adapter';

import { Switch } from 'antdv-next';

defineOptions({
  name: 'PreferenceSwitchItem',
});

withDefaults(defineProps<{ disabled?: boolean; tip?: string }>(), {
  disabled: false,
  tip: '',
});

const checked = defineModel<boolean>();

const slots = useSlots();

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  // 排除 Switch 及其子元素
  if (target.closest('.ant-switch') || target.closest('[role="switch"]'))
    return;
  checked.value = !checked.value;
}
</script>

<template>
  <div
    :class="{
      'pointer-events-none opacity-50': disabled,
    }"
    class="hover:bg-accent my-1 flex w-full items-center justify-between rounded-md px-2 py-2.5"
    @click="handleClick"
  >
    <span class="flex items-center text-sm">
      <slot></slot>

      <VbenTooltip v-if="slots.tip || tip" side="bottom">
        <template #trigger>
          <CircleHelp class="ml-1 size-3 cursor-help" />
        </template>
        <slot name="tip">
          <template v-if="tip">
            <p v-for="(line, index) in tip.split('\n')" :key="index">
              {{ line }}
            </p>
          </template>
        </slot>
      </VbenTooltip>
    </span>
    <span v-if="$slots.shortcut" class="mr-2 ml-auto text-xs opacity-60">
      <slot name="shortcut"></slot>
    </span>
    <span @click.stop>
      <Switch v-model:checked="checked" />
    </span>
  </div>
</template>
