/** @type {import('prettier').Config} */
export default {
  endOfLine: 'auto',
  overrides: [
    {
      files: '*.json5',
      options: {
        quoteProps: 'preserve',
        singleQuote: false,
      },
    },
    {
      files: '*.svg',
      options: {
        parser: 'html',
      },
    },
  ],
  plugins: ['prettier-plugin-tailwindcss'],
  printWidth: 80,
  proseWrap: 'never',
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
};
