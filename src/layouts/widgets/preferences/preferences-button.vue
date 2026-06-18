<script lang="ts" setup>
import { ref } from 'vue';

import { VbenIconButton } from '@/core/ui/adapter';
import { Settings } from '@/icons-app';

import Preferences from './preferences.vue';

const emit = defineEmits<{ clearPreferencesAndLogout: [] }>();

function clearPreferencesAndLogout() {
  emit('clearPreferencesAndLogout');
}

const preferencesRef = ref<InstanceType<typeof Preferences> | null>(null);
</script>

<template>
  <Preferences
    ref="preferencesRef"
    @clear-preferences-and-logout="clearPreferencesAndLogout"
  >
    <VbenIconButton
      class="hover:animate-[shrink_0.3s_ease-in-out]"
      @click="preferencesRef?.open()"
    >
      <Settings class="text-foreground size-4" />
    </VbenIconButton>
  </Preferences>
</template>
