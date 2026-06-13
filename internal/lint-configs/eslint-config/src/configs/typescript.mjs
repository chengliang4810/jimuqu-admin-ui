import { interopDefault } from '../util.mjs';

// 由 unused-imports 插件统一负责未使用变量检测,避免与 ts 规则重复报告
const rulesHandledElsewhere = new Set(['@typescript-eslint/no-unused-vars']);

export async function typescript() {
  const [pluginTs, parserTs] = await Promise.all([
    interopDefault(import('@typescript-eslint/eslint-plugin')),
    interopDefault(import('@typescript-eslint/parser')),
  ]);
  const strictRules = Object.fromEntries(
    Object.entries(pluginTs.configs.strict?.rules ?? {}).filter(
      ([ruleName]) => !rulesHandledElsewhere.has(ruleName),
    ),
  );

  return [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
      languageOptions: {
        parser: parserTs,
        parserOptions: {
          createDefaultProgram: false,
          ecmaFeatures: {
            jsx: true,
          },
          ecmaVersion: 'latest',
          extraFileExtensions: ['.vue'],
          jsxPragma: 'React',
          // 扁平化为单仓后,使用 projectService 按文件就近解析各 workspace 的 tsconfig
          projectService: {
            allowDefaultProject: ['*.config.ts'],
          },
          sourceType: 'module',
          tsconfigRootDir: process.cwd(),
        },
      },
      plugins: {
        '@typescript-eslint': pluginTs,
      },
      rules: {
        ...pluginTs.configs['eslint-recommended']?.overrides?.[0]?.rules,
        ...strictRules,
        // '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
        '@typescript-eslint/consistent-type-definitions': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
      },
    },
  ];
}
