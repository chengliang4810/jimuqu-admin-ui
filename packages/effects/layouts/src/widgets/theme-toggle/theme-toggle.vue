<script lang="ts" setup>
import type { ThemeModeType } from '@vben/types';

import { MoonStar, Sun, SunMoon } from '@vben/icons';
import { $t } from '@vben/locales';
import {
  preferences,
  updatePreferences,
  usePreferences,
} from '@vben/preferences';

import { VbenTooltip } from '@vben-core/ui-adapter';

import { Segmented } from 'antdv-next';

import ThemeButton from './theme-button.vue';

defineOptions({
  name: 'ThemeToggle',
});

withDefaults(defineProps<{ shouldOnHover?: boolean }>(), {
  shouldOnHover: false,
});

function handleChange(isDark: boolean | undefined) {
  updatePreferences({
    theme: { mode: isDark ? 'dark' : 'light' },
  });
}

const { isDark } = usePreferences();

const PRESETS = [
  {
    icon: Sun,
    name: 'light',
    title: $t('preferences.theme.light'),
  },
  {
    icon: MoonStar,
    name: 'dark',
    title: $t('preferences.theme.dark'),
  },
  {
    icon: SunMoon,
    name: 'auto',
    title: $t('preferences.followSystem'),
  },
];
</script>
<template>
  <div>
    <VbenTooltip :disabled="!shouldOnHover" side="bottom">
      <template #trigger>
        <ThemeButton
          :model-value="isDark"
          type="icon"
          @update:model-value="handleChange"
        />
      </template>
      <Segmented
        :value="preferences.theme.mode"
        :options="PRESETS.map((item) => ({ value: item.name }))"
        @change="
          (val: any) =>
            updatePreferences({ theme: { mode: val as ThemeModeType } })
        "
      >
        <template #label="{ value }">
          <component
            :is="PRESETS.find((p) => p.name === value)?.icon"
            class="mx-auto size-5"
          />
        </template>
      </Segmented>
    </VbenTooltip>
  </div>
</template>
