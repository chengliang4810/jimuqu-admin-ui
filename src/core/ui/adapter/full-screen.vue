<script lang="ts" setup>
import { Maximize, Minimize } from '@/core/icons';

import { useFullscreen } from '@vueuse/core';

import VbenIconButton from './icon-button.vue';

defineOptions({ name: 'VbenFullScreen' });

const { isFullscreen, toggle } = useFullscreen();

isFullscreen.value = !!(
  document.fullscreenElement ||
  // @ts-expect-error - vendor fullscreen APIs are not in standard typings
  document.webkitFullscreenElement ||
  // @ts-expect-error - vendor fullscreen APIs are not in standard typings
  document.mozFullScreenElement ||
  // @ts-expect-error - vendor fullscreen APIs are not in standard typings
  document.msFullscreenElement
);
</script>

<template>
  <VbenIconButton @click="toggle">
    <Minimize v-if="isFullscreen" class="text-foreground size-4" />
    <Maximize v-else class="text-foreground size-4" />
  </VbenIconButton>
</template>
