import type { DeepPartial } from '@/types';

import type { Preferences, ThemePresetType } from './types';

/** 旧版本默认主色，用于识别需要迁移的历史缓存。 */
const LEGACY_DEFAULT_PRIMARY_COLOR = '#1476ff';

/** 主题预设定义。 */
interface ThemePresetDefinition {
  /** 深色模式使用的种子色。 */
  darkColor: string;
  /** 预设名称的国际化键。 */
  labelKey: string;
  /** 浅色模式使用的种子色。 */
  lightColor: string;
  /** 预设唯一标识。 */
  value: Exclude<ThemePresetType, 'custom'>;
}

/** 默认中性主题，浅色近黑、深色近白。 */
const DEFAULT_THEME_PRESET: ThemePresetDefinition = {
  darkColor: '#e5e5e5',
  labelKey: 'preferences.theme.preset.default',
  lightColor: '#171717',
  value: 'default',
};

/**
 * 可选主题预设。
 * 彩色预设只提供 Seed Color，完整色阶交由 antdv-next 算法派生。
 */
const THEME_PRESETS: readonly ThemePresetDefinition[] = [
  DEFAULT_THEME_PRESET,
  /** 品牌蓝。 */
  {
    darkColor: '#1677ff',
    labelKey: 'preferences.theme.preset.brandBlue',
    lightColor: '#1677ff',
    value: 'brand-blue',
  },
  /** 极客蓝。 */
  {
    darkColor: '#2f54eb',
    labelKey: 'preferences.theme.preset.geekBlue',
    lightColor: '#2f54eb',
    value: 'geek-blue',
  },
  /** 紫色。 */
  {
    darkColor: '#722ed1',
    labelKey: 'preferences.theme.preset.purple',
    lightColor: '#722ed1',
    value: 'purple',
  },
  /** 品红。 */
  {
    darkColor: '#eb2f96',
    labelKey: 'preferences.theme.preset.magenta',
    lightColor: '#eb2f96',
    value: 'magenta',
  },
  /** 红色。 */
  {
    darkColor: '#f5222d',
    labelKey: 'preferences.theme.preset.red',
    lightColor: '#f5222d',
    value: 'red',
  },
  /** 橙色。 */
  {
    darkColor: '#fa8c16',
    labelKey: 'preferences.theme.preset.orange',
    lightColor: '#fa8c16',
    value: 'orange',
  },
  /** 金色。 */
  {
    darkColor: '#faad14',
    labelKey: 'preferences.theme.preset.gold',
    lightColor: '#faad14',
    value: 'gold',
  },
  /** 青柠。 */
  {
    darkColor: '#a0d911',
    labelKey: 'preferences.theme.preset.lime',
    lightColor: '#a0d911',
    value: 'lime',
  },
  /** 绿色。 */
  {
    darkColor: '#52c41a',
    labelKey: 'preferences.theme.preset.green',
    lightColor: '#52c41a',
    value: 'green',
  },
  /** 青色。 */
  {
    darkColor: '#13c2c2',
    labelKey: 'preferences.theme.preset.cyan',
    lightColor: '#13c2c2',
    value: 'cyan',
  },
];

/** 所有合法主题预设标识。 */
const THEME_PRESET_VALUES = new Set<ThemePresetType>([
  ...THEME_PRESETS.map(({ value }) => value),
  'custom',
]);

/**
 * 判断缓存值是否为合法主题预设。
 * @param value 待判断的缓存值。
 */
function isThemePreset(value: unknown): value is ThemePresetType {
  return (
    typeof value === 'string' &&
    THEME_PRESET_VALUES.has(value as ThemePresetType)
  );
}

/**
 * 为旧缓存补充主题预设。
 * 历史默认主色迁移为 default，其他主色迁移为 custom。
 * @param cachedPreferences 缓存中的偏好设置。
 */
function migrateCachedThemePreset(
  cachedPreferences: DeepPartial<Preferences>,
): DeepPartial<Preferences> {
  const cachedTheme = cachedPreferences.theme;
  if (!cachedTheme || isThemePreset(cachedTheme.preset)) {
    return cachedPreferences;
  }

  const cachedPrimary =
    typeof cachedTheme.colorPrimary === 'string'
      ? cachedTheme.colorPrimary.trim().toLowerCase()
      : '';
  const preset: ThemePresetType =
    !cachedPrimary || cachedPrimary === LEGACY_DEFAULT_PRIMARY_COLOR
      ? 'default'
      : 'custom';

  return {
    ...cachedPreferences,
    theme: {
      ...cachedTheme,
      preset,
    },
  };
}

/**
 * 根据主题预设和实际亮暗状态解析 antdv-next 主色 Seed Color。
 * @param preset 当前主题预设。
 * @param customColor 用户保存的自定义主色。
 * @param isDark 当前是否为深色模式。
 */
function resolveThemePrimary(
  preset: ThemePresetType,
  customColor: string,
  isDark: boolean,
): string {
  if (preset === 'custom') {
    return customColor;
  }

  const matchedPreset =
    THEME_PRESETS.find(({ value }) => value === preset) ?? DEFAULT_THEME_PRESET;
  return isDark ? matchedPreset.darkColor : matchedPreset.lightColor;
}

export {
  DEFAULT_THEME_PRESET,
  LEGACY_DEFAULT_PRIMARY_COLOR,
  migrateCachedThemePreset,
  resolveThemePrimary,
  THEME_PRESETS,
};
export type { ThemePresetDefinition };
