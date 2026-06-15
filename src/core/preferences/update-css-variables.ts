import type { Preferences } from './types';

/**
 * 更新主题相关的 CSS 变量。
 *
 * 反转后 antd 接管了全部颜色(--ant-*)，这里只负责:
 * 1. 切换 .dark 类(供 tailwind dark: variant 与自定义语义色的暗色覆盖)
 * 2. 注入圆角 --radius(tailwind --radius-* 派生使用)
 * @param preferences - 当前偏好设置对象，它的主题值将被用来设置文档的主题。
 */
function updateCSSVariables(preferences: Preferences) {
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

  // 更新圆角
  if (Reflect.has(theme, 'radius')) {
    root.style.setProperty('--radius', `${radius}rem`);
  }
}

function isDarkTheme(theme: string) {
  let dark = theme === 'dark';
  if (theme === 'auto') {
    dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return dark;
}

export { isDarkTheme, updateCSSVariables };
