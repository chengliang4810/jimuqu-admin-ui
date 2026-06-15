<script setup lang="ts">
import { computed } from 'vue';

import { $t } from '@/locales';

import SwitchItem from '../switch-item.vue';

defineOptions({
  name: 'PreferenceBreadcrumbConfig',
});

const props = defineProps<{ disabled?: boolean }>();

const breadcrumbEnable = defineModel<boolean>('breadcrumbEnable');
const breadcrumbShowIcon = defineModel<boolean>('breadcrumbShowIcon');
const breadcrumbShowHome = defineModel<boolean>('breadcrumbShowHome');
const breadcrumbHideOnlyOne = defineModel<boolean>('breadcrumbHideOnlyOne');

const disableItem = computed(() => {
  return !breadcrumbEnable.value || props.disabled;
});
</script>

<template>
  <SwitchItem v-model="breadcrumbEnable" :disabled="disabled">
    {{ $t('preferences.breadcrumb.enable') }}
  </SwitchItem>
  <SwitchItem v-model="breadcrumbHideOnlyOne" :disabled="disableItem">
    {{ $t('preferences.breadcrumb.hideOnlyOne') }}
  </SwitchItem>
  <SwitchItem v-model="breadcrumbShowIcon" :disabled="disableItem">
    {{ $t('preferences.breadcrumb.icon') }}
  </SwitchItem>
  <SwitchItem
    v-model="breadcrumbShowHome"
    :disabled="disableItem || !breadcrumbShowIcon"
  >
    {{ $t('preferences.breadcrumb.home') }}
  </SwitchItem>
</template>
