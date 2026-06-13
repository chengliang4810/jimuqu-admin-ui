<script lang="ts" setup>
import { updatePreferences, usePreferences } from '@/core/preferences';

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
</script>

<template>
  <div>
    <ThemeButton
      :model-value="isDark"
      type="icon"
      @update:model-value="handleChange"
    />
  </div>
</template>
