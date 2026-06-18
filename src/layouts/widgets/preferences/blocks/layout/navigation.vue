<script setup lang="ts">
import { $t } from '@/locales';

import SwitchItem from '../switch-item.vue';

defineOptions({
  name: 'PreferenceNavigationConfig',
});

defineProps<{ disabled?: boolean; disabledNavigationSplit?: boolean }>();

const navigationSplit = defineModel<boolean>('navigationSplit');
const navigationAccordion = defineModel<boolean>('navigationAccordion');
</script>

<template>
  <SwitchItem
    v-model="navigationSplit"
    :disabled="disabledNavigationSplit || disabled"
  >
    {{ $t('preferences.navigationMenu.split') }}
    <template #tip>
      {{ $t('preferences.navigationMenu.splitTip') }}
    </template>
  </SwitchItem>
  <SwitchItem v-model="navigationAccordion" :disabled="disabled">
    {{ $t('preferences.navigationMenu.accordion') }}
  </SwitchItem>
</template>
