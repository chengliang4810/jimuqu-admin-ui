import type { AliasToken } from 'antdv-next/dist/theme/internal';

import { computed } from 'vue';

import { preferences } from '@/core/preferences';

/**
 * antdv-next 的 seed token。
 *
 * 反转后 antd 作为颜色真相源:这里只提供「用户可配置」的种子色(主色/成功/
 * 警告/错误)与圆角,其余中性色由 antd algorithm 派生,并通过 ConfigProvider
 * 的 `cssVar` 以 `--ant-*` 变量输出到 :root,供 tailwind 与自定义层消费。
 *
 * 种子色直接取自 preferences.theme(已是 hex),antd 内部用 tinycolor 解析,
 * 无需再做格式转换;又因 preferences.theme 是 reactive,这里用 computed 即可。
 */
export function useAntdvNextTokens() {
  const tokens = computed<Partial<AliasToken>>(() => {
    const {
      borderRadius,
      colorError,
      colorPrimary,
      colorSuccess,
      colorWarning,
    } = preferences.theme;

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
