import { defineConfig } from '@vben/eslint-config';

/**
 * 禁止"模块内部引用自身 barrel(@/<dir>)"。
 *
 * 例如 src/utils 下的文件不应 `import { cn } from '@/utils'`,
 * 因为 @/utils 又会 re-export 该文件,形成 文件 -> barrel -> 文件 的循环依赖,
 * 在涉及 enum / 常量初始化顺序时可能出现运行时 undefined。
 *
 * 正确做法:改用相对路径(如 './cn'、'../helpers')或直接引用真实源模块
 * (如 '@/core/ui/popup')。
 *
 * 注:使用 no-restricted-imports 的 paths(精确匹配),仅禁止 barrel 本身
 * (@/utils),不影响深层路径(@/utils/http、@/api/common 等)。
 */
const selfBarrelDirs = [
  'api',
  'components',
  'constants',
  'hooks',
  'icons',
  'layouts',
  'locales',
  'router',
  'stores',
  'styles',
  'types',
  'utils',
];

const noSelfBarrelImport = selfBarrelDirs.map((dir) => ({
  files: [`src/${dir}/**`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: `@/${dir}`,
            message: `禁止在 @/${dir} 内部引用自身 barrel,请改用相对路径或直接引用真实源模块,避免循环依赖。`,
          },
        ],
      },
    ],
  },
}));

export default defineConfig(noSelfBarrelImport);
