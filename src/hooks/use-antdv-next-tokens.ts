import type { AliasToken } from 'antdv-next/dist/theme/internal';

import { computed } from 'vue';

import {
  preferences,
  resolveThemePrimary,
  usePreferences,
} from '@/core/preferences';

/**
 * antdv-next 的 seed token。
 *
 * 反转后 antd 作为颜色真相源:这里只提供「用户可配置」的种子色(主色/成功/
 * 警告/错误)与圆角,其余中性色由 antd algorithm 派生,并通过 ConfigProvider
 * 的 `cssVar` 以 `--ant-*` 变量输出到 :root,供 tailwind 与自定义层消费。
 *
 * 主题主色按预设和实际亮暗状态解析；自定义模式读取 colorPrimary。
 * 状态色直接取自 preferences.theme，预设切换不会覆盖它们。
 */
export function useAntdvNextTokens() {
  const { isDark } = usePreferences();

  const tokens = computed<Partial<AliasToken>>(() => {
    const {
      borderRadius,
      colorError,
      colorSuccess,
      colorWarning,
      colorPrimary: customPrimary,
      preset,
    } = preferences.theme;
    const colorPrimary = resolveThemePrimary(
      preset,
      customPrimary,
      isDark.value,
    );

    return {
      borderRadius, // px，与 antd borderRadius 一致
      colorError,
      colorInfo: colorPrimary,
      colorPrimary,
      colorSuccess,
      colorWarning,
      // 调整基础弹层层级，避免下拉等组件被弹窗或者最大化状态下的表格遮挡
      zIndexPopupBase: 2000,
    };
  });

  return {
    tokens,
  };
}
