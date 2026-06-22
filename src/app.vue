<script lang="ts" setup>
import type { ConfigProviderProps } from 'antdv-next';

import { computed } from 'vue';

import { preferences, usePreferences } from '@/core/preferences';
import { useAntdvNextTokens } from '@/hooks';
import { antdLocale } from '@/locales';
import { App, ConfigProvider, Spin, theme } from 'antdv-next';
import { storeToRefs } from 'pinia';

import { useGlobalLoadingStore } from './stores/loading';
import { PopupContext } from './utils/context';

defineOptions({ name: 'App' });

const { isDark } = usePreferences();
const { tokens } = useAntdvNextTokens();

const tokenTheme = computed(() => {
  const algorithm = isDark.value
    ? [theme.darkAlgorithm]
    : [theme.defaultAlgorithm];

  // antd 紧凑模式算法
  if (preferences.app.compact) {
    algorithm.push(theme.compactAlgorithm);
  }

  return {
    algorithm,
    // 开启 antd cssVar:将全套 token 以 --ant-* 输出到 :root，作为颜色真相源
    cssVar: { key: 'ant' },
    // 关闭样式 hash，保证 --ant-* 变量名稳定，可被 tailwind / 自定义层引用
    hashed: false,
    token: tokens.value,
  };
});

const otherProps = computed<Omit<ConfigProviderProps, 'locale' | 'theme'>>(
  () => {
    // 目前不生效?
    return {
      modal: { mask: { blur: false } },
      drawer: { mask: { blur: false } },
    };
  },
);

const loadingStore = useGlobalLoadingStore();
const { globalLoading } = storeToRefs(loadingStore);
</script>

<template>
  <ConfigProvider :locale="antdLocale" :theme="tokenTheme" v-bind="otherProps">
    <App :message="{ maxCount: 1 }">
      <RouterView />
      <PopupContext />
      <!-- 全局loading遮罩 -->
      <Spin
        :fullscreen="true"
        :spinning="globalLoading"
        :delay="300"
        size="large"
      />
    </App>
  </ConfigProvider>
</template>
