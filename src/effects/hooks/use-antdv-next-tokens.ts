import { computed } from 'vue';

import { preferences } from '@/core/preferences';
import { convertToHsl } from '@/core/shared/color';

/**
 * antdv-next 的 seed token。
 *
 * 反转后 antd 作为颜色真相源:这里只提供「用户可配置」的种子色(主色/成功/
 * 警告/错误)与圆角,其余中性色由 antd algorithm 派生,并通过 ConfigProvider
 * 的 `cssVar` 以 `--ant-*` 变量输出到 :root,供 tailwind 与自定义层消费。
 *
 * 由于种子色直接取自 reactive 的 preferences.theme，这里用 computed 即可，
 * 无需再 watch CSS 变量。
 */
export function useAntdvNextTokens() {
  const tokens = computed(() => {
    const { colorDestructive, colorPrimary, colorSuccess, colorWarning, radius } =
      preferences.theme;

    return {
      borderRadius: Number.parseFloat(radius) * 16, // 1rem = 16px
      colorError: convertToHsl(colorDestructive),
      colorInfo: convertToHsl(colorPrimary),
      colorPrimary: convertToHsl(colorPrimary),
      colorSuccess: convertToHsl(colorSuccess),
      colorWarning: convertToHsl(colorWarning),
      // 调整基础弹层层级，避免下拉等组件被弹窗或者最大化状态下的表格遮挡
      zIndexPopupBase: 2000,
    };
  });

  return {
    tokens,
  };
}
