import type { DeepPartial } from '@/types';

import type { Preferences } from '../types';

import { describe, expect, it } from 'vitest';

import {
  migrateCachedThemePreset,
  resolveThemePrimary,
  THEME_PRESETS,
} from '../theme-presets';

describe('主题预设', () => {
  it('按默认主题和 10 个彩色预设的固定顺序提供色值', () => {
    expect(THEME_PRESETS.map(({ value }) => value)).toEqual([
      'default',
      'brand-blue',
      'geek-blue',
      'purple',
      'magenta',
      'red',
      'orange',
      'gold',
      'lime',
      'green',
      'cyan',
    ]);
  });

  it('根据实际亮暗状态解析默认主题主色', () => {
    expect(resolveThemePrimary('default', '#1476ff', false)).toBe('#171717');
    expect(resolveThemePrimary('default', '#1476ff', true)).toBe('#e5e5e5');
  });

  it('彩色预设使用固定种子色，自定义预设使用保存的主色', () => {
    expect(resolveThemePrimary('brand-blue', '#abcdef', false)).toBe('#1677ff');
    expect(resolveThemePrimary('brand-blue', '#abcdef', true)).toBe('#1677ff');
    expect(resolveThemePrimary('custom', '#abcdef', false)).toBe('#abcdef');
  });

  it('将旧默认主色缓存迁移为默认预设并保留状态色', () => {
    const cachedPreferences: DeepPartial<Preferences> = {
      theme: {
        colorError: '#cc0000',
        colorPrimary: '#1476FF',
        colorSuccess: '#00cc00',
        colorWarning: '#ffaa00',
      },
    };

    expect(migrateCachedThemePreset(cachedPreferences).theme).toEqual({
      colorError: '#cc0000',
      colorPrimary: '#1476FF',
      colorSuccess: '#00cc00',
      colorWarning: '#ffaa00',
      preset: 'default',
    });
  });

  it('将其他旧主色缓存迁移为自定义预设', () => {
    const cachedPreferences: DeepPartial<Preferences> = {
      theme: {
        colorPrimary: '#123456',
      },
    };

    expect(migrateCachedThemePreset(cachedPreferences).theme?.preset).toBe(
      'custom',
    );
  });

  it('保留缓存中已有的合法预设', () => {
    const cachedPreferences: DeepPartial<Preferences> = {
      theme: {
        colorPrimary: '#123456',
        preset: 'green',
      },
    };

    expect(migrateCachedThemePreset(cachedPreferences)).toBe(cachedPreferences);
  });
});
