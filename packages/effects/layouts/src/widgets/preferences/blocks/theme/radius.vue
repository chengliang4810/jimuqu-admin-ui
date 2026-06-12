<script setup lang="ts">
import { Segmented } from 'antdv-next';

defineOptions({
  name: 'PreferenceColorMode',
});

const modelValue = defineModel<string | undefined>('themeRadius', {
  default: '0.5',
});

const items = [
  { label: '0', value: '0' },
  { label: '0.25', value: '0.25' },
  { label: '0.5', value: '0.5' },
  { label: '0.75', value: '0.75' },
  { label: '1', value: '1' },
];
</script>

<template>
  <Segmented v-model:value="modelValue" :options="items" />
</template>
