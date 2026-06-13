<script setup lang="ts">
import { provide, ref, watch } from 'vue';

import { tabsContextKey } from './tabs-context';

const props = withDefaults(
  defineProps<{
    class?: any;
    defaultValue?: number | string;
    orientation?: 'horizontal' | 'vertical';
  }>(),
  {
    orientation: 'horizontal',
  },
);

const modelValue = defineModel<number | string>();
const activeValue = ref<number | string | undefined>(
  modelValue.value ?? props.defaultValue,
);

watch(
  () => modelValue.value,
  (value) => {
    if (value !== undefined) {
      activeValue.value = value;
    }
  },
);

watch(
  () => props.defaultValue,
  (value) => {
    if (modelValue.value === undefined) {
      activeValue.value = value;
    }
  },
);

function setActiveValue(value: number | string) {
  activeValue.value = value;
  modelValue.value = value;
}

provide(tabsContextKey, {
  activeValue,
  setActiveValue,
});
</script>

<template>
  <div :class="props.class" :data-orientation="orientation">
    <slot></slot>
  </div>
</template>
