import type { DefineConfig, VbenViteConfig } from '../typing';

import { defineApplicationConfig } from './application';

export { defineApplicationConfig } from './application';

function defineConfig(userConfigPromise?: DefineConfig): VbenViteConfig {
  return defineApplicationConfig(userConfigPromise);
}

export { defineConfig };
