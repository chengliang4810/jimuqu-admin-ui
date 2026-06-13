import prettierConfig from 'eslint-config-prettier';

import {
  ignores,
  imports,
  javascript,
  jsonc,
  node,
  perfectionist,
  pnpm,
  typescript,
  unicorn,
  vue,
  yaml,
} from './configs/index.mjs';

async function defineConfig(config = []) {
  const configs = [
    vue(),
    javascript(),
    imports(),
    ignores(),
    typescript(),
    jsonc(),
    node(),
    perfectionist(),
    unicorn(),
    yaml(),
    pnpm(),
    ...config,
    // 关闭与 prettier 冲突的格式化规则,必须放在最后
    prettierConfig,
  ];

  const resolved = await Promise.all(configs);

  return resolved.flat();
}

export { defineConfig };
