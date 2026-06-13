<script setup lang="ts">
import type { SelectOption } from '@/types';

import { useSlots } from 'vue';

import { CircleHelp } from '@/icons-app';

import { VbenTooltip } from '@/core/ui/adapter';

import { Button } from 'antdv-next';

defineOptions({
  name: 'PreferenceCheckboxItem',
});

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    items?: SelectOption[];
    multiple?: boolean;
    onBtnClick?: (value: string) => void;
    placeholder?: string;
  }>(),
  {
    disabled: false,
    placeholder: '',
    items: () => [],
    onBtnClick: () => {},
    multiple: false,
  },
);

const inputValue = defineModel<string[]>();

const slots = useSlots();

function isActive(value: string) {
  return inputValue.value?.includes(value);
}

function handleClick(value: string) {
  if (props.disabled) {
    return;
  }
  const current = [...(inputValue.value ?? [])];
  if (props.multiple) {
    const index = current.indexOf(value);
    if (index === -1) {
      current.push(value);
    } else {
      current.splice(index, 1);
    }
    inputValue.value = current;
  } else {
    inputValue.value = [value];
  }
  props.onBtnClick?.(value);
}
</script>

<template>
  <div
    :class="{
      'hover:bg-accent': !slots.tip,
      'pointer-events-none opacity-50': disabled,
    }"
    class="my-1 flex w-full items-center justify-between rounded-md px-2 py-1"
  >
    <span class="flex items-center text-sm">
      <slot></slot>

      <VbenTooltip v-if="slots.tip" side="bottom">
        <template #trigger>
          <CircleHelp class="ml-1 size-3 cursor-help" />
        </template>
        <slot name="tip"></slot>
      </VbenTooltip>
    </span>
    <div class="flex w-41.25 justify-end gap-1">
      <Button
        v-for="item in items"
        :key="item.value"
        size="small"
        :type="isActive(item.value as string) ? 'primary' : 'default'"
        :disabled="disabled"
        @click="handleClick(item.value as string)"
      >
        {{ item.label }}
      </Button>
    </div>
  </div>
</template>
