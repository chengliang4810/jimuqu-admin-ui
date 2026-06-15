import type { Preferences } from './types';

import { convertToHslCssVar } from '@/core/shared/color';

/**
 * 更新主题的 CSS 变量以及其他 CSS 变量
 * @param preferences - 当前偏好设置对象，它的主题值将被用来设置文档的主题。
 */
function updateCSSVariables(preferences: Preferences) {
  // 当修改到颜色变量时，更新 css 变量
  const root = document.documentElement;
  if (!root) {
    return;
  }

  const theme = preferences?.theme ?? {};

  const { mode, radius } = theme;

  // html 设置 dark 类
  if (Reflect.has(theme, 'mode')) {
    const dark = isDarkTheme(mode);
    root.classList.toggle('dark', dark);
  }

  // 如果颜色变量存在，则更新主题颜色
  if (
    Reflect.has(theme, 'colorPrimary') ||
    Reflect.has(theme, 'colorDestructive') ||
    Reflect.has(theme, 'colorSuccess') ||
    Reflect.has(theme, 'colorWarning')
  ) {
    updateMainColorVariables(preferences);
  }

  // 更新圆角
  if (Reflect.has(theme, 'radius')) {
    document.documentElement.style.setProperty('--radius', `${radius}rem`);
  }
}

/**
 * 更新主题种子色变量。
 *
 * 反转后 antd 接管了完整色阶(--ant-*)，这里不再生成 50~900 色阶，
 * 仅注入 4 个种子主色(HSL 裸值)，供 default.css 中 accent-color 等原生属性引用。
 * (antd seed 已由 use-antdv-next-tokens 直接读取 preferences，不再依赖这些变量。)
 * @param preference - 当前偏好设置对象。
 */
function updateMainColorVariables(preference: Preferences) {
  if (!preference.theme) {
    return;
  }
  const { colorDestructive, colorPrimary, colorSuccess, colorWarning } =
    preference.theme;

  const seedColors: Record<string, string | undefined> = {
    '--destructive': colorDestructive,
    '--primary': colorPrimary,
    '--success': colorSuccess,
    '--warning': colorWarning,
  };

  Object.entries(seedColors).forEach(([cssVar, color]) => {
    if (color) {
      document.documentElement.style.setProperty(cssVar, convertToHslCssVar(color));
    }
  });
}

function isDarkTheme(theme: string) {
  let dark = theme === 'dark';
  if (theme === 'auto') {
    dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return dark;
}

export { isDarkTheme, updateCSSVariables };
