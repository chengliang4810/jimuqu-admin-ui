import type { Preferences } from './types';

import { convertToHslCssVar, isDarkColor } from '@/core/shared/color';

import { resolveThemePrimary } from './theme-presets';

/**
 * 更新主题相关的 CSS 变量。
 *
 * 反转后 antd 接管了全部颜色与圆角(--ant-*)，这里只负责切换 .dark 类
 * (供 tailwind dark: variant 与自定义语义色的暗色覆盖)，并补充 antd
 * 没有提供的主色前景色。
 * @param preferences - 当前偏好设置对象，它的主题值将被用来设置文档的主题。
 */
function updateCSSVariables(preferences: Preferences) {
  const root = document.documentElement;
  if (!root) {
    return;
  }

  const theme = preferences?.theme ?? {};

  const { mode } = theme;
  const dark = isDarkTheme(mode);

  // html 设置 dark 类
  if (Reflect.has(theme, 'mode')) {
    root.classList.toggle('dark', dark);
  }

  // 根据主色明暗生成高对比前景色，供实心菜单、Tag 和 Tailwind 语义色复用
  const primaryColor = resolveThemePrimary(
    theme.preset,
    theme.colorPrimary,
    dark,
  );
  const primaryForeground = isDarkColor(primaryColor) ? '#fafafa' : '#171717';
  root.style.setProperty(
    '--primary-foreground',
    convertToHslCssVar(primaryForeground),
  );
}

function isDarkTheme(theme: string) {
  let dark = theme === 'dark';
  if (theme === 'auto') {
    dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return dark;
}

export { isDarkTheme, updateCSSVariables };
