<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';

import changeLog from '@/../changelog.md?raw';
import { usePreferences } from '@/core/preferences';
import { Page } from '@/components';
// import { XMarkdown } from '@antdv-next/x-markdown';

import '@antdv-next/x-markdown/themes/index.css';
import '@antdv-next/x-markdown/themes/light.css';
import '@antdv-next/x-markdown/themes/dark.css';

const { isDark } = usePreferences();
const markdownClass = computed(() => {
  return isDark.value ? 'x-markdown-dark' : 'x-markdown-light';
});

const XMarkdown = defineAsyncComponent(async () => {
  const mod = await import('@antdv-next/x-markdown');
  return mod.XMarkdown;
});
</script>

<template>
  <Page :auto-content-height="true" title="更新日志">
    <XMarkdown :content="changeLog" :class="markdownClass" />
  </Page>
</template>
