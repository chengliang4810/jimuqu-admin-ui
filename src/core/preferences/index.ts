import type {
  CustomPreferencesRecord,
  Preferences,
  PreferencesExtension,
} from './types';
import type { DeepPartial } from '@/core/typings';

import { preferencesManager } from './preferences';

/**
 * 如果你想所有的app都使用相同的默认偏好设置，你可以在这里定义
 * 而不是去修改 @vben-core/preferences 中的默认偏好设置
 * @param preferences
 * @returns
 */
function defineOverridesPreferences(preferences: DeepPartial<Preferences>) {
  return preferences;
}

function definePreferencesExtension<
  TCustomPreferences extends object = CustomPreferencesRecord,
>(extension: PreferencesExtension<TCustomPreferences>) {
  return extension;
}

export { defineOverridesPreferences, definePreferencesExtension };

export const {
  getPreferences,
  getCustomPreferences,
  getInitialCustomPreferences,
  getPreferencesExtension,
  updatePreferences,
  updateCustomPreferences,
  resetPreferences,
  clearCache,
  initPreferences,
} = preferencesManager;

export const preferences: Preferences = getPreferences();

export { preferencesManager };

export * from './constants';
export type * from './types';
export * from './use-preferences';
