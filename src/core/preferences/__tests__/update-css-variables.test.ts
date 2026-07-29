import { afterEach, describe, expect, it } from 'vitest';

import { defaultPreferences } from '../config';
import { updateCSSVariables } from '../update-css-variables';

afterEach(() => {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.removeProperty('--primary-foreground');
});

describe('主题 CSS 变量', () => {
  it('默认主题在浅色模式使用白色主色前景', () => {
    updateCSSVariables({
      ...defaultPreferences,
      theme: {
        ...defaultPreferences.theme,
        mode: 'light',
        preset: 'default',
      },
    });

    expect(
      document.documentElement.style.getPropertyValue('--primary-foreground'),
    ).toBe('0 0% 98%');
  });

  it('默认主题在深色模式使用深色主色前景', () => {
    updateCSSVariables({
      ...defaultPreferences,
      theme: {
        ...defaultPreferences.theme,
        mode: 'dark',
        preset: 'default',
      },
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(
      document.documentElement.style.getPropertyValue('--primary-foreground'),
    ).toBe('0 0% 9%');
  });

  it('浅色的金色预设使用深色主色前景', () => {
    updateCSSVariables({
      ...defaultPreferences,
      theme: {
        ...defaultPreferences.theme,
        mode: 'light',
        preset: 'gold',
      },
    });

    expect(
      document.documentElement.style.getPropertyValue('--primary-foreground'),
    ).toBe('0 0% 9%');
  });
});
