const restrictedImportIgnores = ['**/vite.config.mts'];

const customConfig = [
  // shadcn-ui 内部组件是自动生成的，不做太多限制
  {
    files: ['src/core/ui/shadcn/**/**'],
    rules: {
      'vue/require-default-prop': 'off',
    },
  },
  {
    files: [
      'src/effects/**/**',
      'src/utils/**/**',
      'src/types/**/**',
      'src/locales/**/**',
    ],
    ignores: restrictedImportIgnores,
    rules: {
      'perfectionist/sort-interfaces': 'off',
    },
  },
  {
    // core内部组件
    files: ['src/core/**/**'],
    ignores: restrictedImportIgnores,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*'],
              message: 'The core package cannot import the app-level packages',
            },
          ],
        },
      ],
    },
  },
  {
    // 不能引入@vben/*里面的包（已废弃，此为兜底规则）
    files: [
      'src/types/**/**',
      'src/utils/**/**',
      'src/icons-app/**/**',
      'src/constants/**/**',
      'src/styles/**/**',
      'src/stores/**/**',
      'src/core/preferences/**/**',
      'src/locales/**/**',
    ],
    ignores: restrictedImportIgnores,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@vben/*'],
              message:
                'The @vben package is deprecated, please use the @/ path instead',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/**/playwright.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['internal/**/**', 'scripts/**/**'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/core/shared/utils/inference.ts'],
    rules: {
      'vue/prefer-import-from-vue': 'off',
    },
  },
];

export { customConfig };
