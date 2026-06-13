<script setup lang="ts">
import type { SupportedLanguagesType } from '@/locales';

import { SUPPORT_LANGUAGES } from '@/constants';
import { Languages } from '@/icons-app';
import { loadLocaleMessages } from '@/locales';
import { preferences, updatePreferences } from '@/core/preferences';

import { VbenDropdownRadioMenu, VbenIconButton } from '@/core/ui/adapter';

defineOptions({
  name: 'LanguageToggle',
});

async function handleUpdate(value: string | undefined) {
  if (!value) return;
  const locale = value as SupportedLanguagesType;
  updatePreferences({
    app: {
      locale,
    },
  });
  await loadLocaleMessages(locale);
}
</script>

<template>
  <div>
    <VbenDropdownRadioMenu
      :menus="SUPPORT_LANGUAGES"
      :model-value="preferences.app.locale"
      @update:model-value="handleUpdate"
    >
      <VbenIconButton class="hover:animate-[shrink_0.3s_ease-in-out]">
        <Languages class="size-4 text-foreground" />
      </VbenIconButton>
    </VbenDropdownRadioMenu>
  </div>
</template>
