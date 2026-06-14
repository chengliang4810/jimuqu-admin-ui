import type { BuiltinThemeType } from '@/core/typings';

interface BuiltinThemePreset {
  color: string;
  darkPrimaryColor?: string;
  primaryColor?: string;
  type: BuiltinThemeType;
}

const BUILT_IN_THEME_PRESETS: BuiltinThemePreset[] = [
  {
    color: 'hsl(215 100% 54%)',
    type: 'default',
  },
];

export { BUILT_IN_THEME_PRESETS };

export type { BuiltinThemePreset };
