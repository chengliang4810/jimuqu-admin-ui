<script setup lang="ts">
import type { ThemePreferences } from '@/core/preferences';

import { Segmented } from 'antdv-next';

defineOptions({
  name: 'PreferenceButtonWaveMode',
});

const modelValue = defineModel<string>('themeButtonWaveMode', {
  default: 'default',
});

type ButtonWaveModeItem = {
  label: ThemePreferences['buttonWaveMode'];
  value: ThemePreferences['buttonWaveMode'];
};
const items: ButtonWaveModeItem[] = (
  ['Default', 'Disabled', 'Happy', 'Inset', 'Shake'] as const
).map((item) => ({
  label: item,
  value: item,
}));
</script>

<template>
  <Segmented v-model:value="modelValue" :options="items" />
</template>
