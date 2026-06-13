import { interopDefault } from '../util.mjs';

export async function imports() {
  const pluginImport = await interopDefault(import('eslint-plugin-import'));

  return [
    {
      plugins: {
        import: pluginImport,
      },
      rules: {
        'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
        'import/first': 'error',
        'import/no-duplicates': 'error',
        'import/no-mutable-exports': 'error',
        'import/no-named-as-default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-named-default': 'error',
        'import/no-self-import': 'error',
        'import/no-unassigned-import': 'off',
        'import/no-webpack-loader-syntax': 'error',
      },
    },
  ];
}
