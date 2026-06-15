const createChunkMatcher = (patterns: string[]) => {
  return (id: string) => {
    const normalizedId = id.includes('\\') ? id.replaceAll('\\', '/') : id;
    return patterns.some((pattern) => normalizedId.includes(pattern));
  };
};

// 将包名/作用域展开为 pnpm 虚拟目录与提升后真实目录两种匹配前缀
// 作用域: '@vue'           → '/node_modules/.pnpm/@vue+'  '/node_modules/@vue/'
// 包名:   'vue' | '@a/b'   → '/node_modules/.pnpm/vue@'   '/node_modules/vue/'
const fromPnpm = (...specs: string[]) =>
  specs.flatMap((spec) =>
    spec.startsWith('@') && !spec.includes('/')
      ? [`/node_modules/.pnpm/${spec}+`, `/node_modules/${spec}/`]
      : [
          `/node_modules/.pnpm/${spec.replaceAll('/', '+')}@`,
          `/node_modules/${spec}/`,
        ],
  );

// antdv-next 各子模块构建产物目录
const fromAntdvDist = (...names: string[]) =>
  names.map((name) => `/node_modules/antdv-next/dist/${name}/`);

const matchAntdvNextIconsChunk = createChunkMatcher(
  fromPnpm('@ant-design/icons-svg', '@antdv-next/icons'),
);
const matchAntdvNextThemeChunk = createChunkMatcher([
  ...fromPnpm(
    '@ant-design/colors',
    '@ant-design/fast-color',
    '@antdv-next/cssinjs',
    '@antdv-next/happy-work-theme',
  ),
  ...fromAntdvDist('config-provider', 'locale', 'style', 'theme'),
]);
const matchAntdvNextFormChunk = createChunkMatcher(
  fromAntdvDist(
    'auto-complete',
    'calendar',
    'cascader',
    'checkbox',
    'color-picker',
    'date-picker',
    'form',
    'input-number',
    'input',
    'mentions',
    'radio',
    'rate',
    'select',
    'slider',
    'switch',
    'time-picker',
    'transfer',
    'tree-select',
    'upload',
  ),
);
const matchAntdvNextOverlayChunk = createChunkMatcher(
  fromAntdvDist(
    'drawer',
    'dropdown',
    'message',
    'modal',
    'notification',
    'popconfirm',
    'popover',
    'tooltip',
    'tour',
  ),
);
const matchAntdvNextDataChunk = createChunkMatcher(
  fromAntdvDist(
    'avatar',
    'badge',
    'card',
    'descriptions',
    'empty',
    'image',
    'list',
    'pagination',
    'progress',
    'qrcode',
    'skeleton',
    'statistic',
    'table',
    'tag',
    'timeline',
    'tree',
  ),
);
const matchAntdvNextLayoutChunk = createChunkMatcher(
  fromAntdvDist(
    'affix',
    'alert',
    'anchor',
    'app',
    'border-beam',
    'breadcrumb',
    'button',
    'carousel',
    'collapse',
    'divider',
    'flex',
    'float-button',
    'grid',
    'layout',
    'masonry',
    'menu',
    'result',
    'segmented',
    'space',
    'spin',
    'splitter',
    'steps',
    'tabs',
    'typography',
    'watermark',
  ),
);
const matchAntdvNextSharedChunk = createChunkMatcher([
  '/node_modules/.pnpm/antdv-next@',
  ...fromPnpm('@v-c'),
]);
const matchAntdvNextChunk = createChunkMatcher(['antdv-next']);
const matchFrameworkChunk = createChunkMatcher(
  fromPnpm('@vue', '@vueuse', 'pinia', 'vue-router', 'vue'),
);
const matchVbenCoreChunk = createChunkMatcher([
  '/src/core/shared/',
  '/src/core/typings/',
  '/src/core/icons/',
  '/src/styles/design/',
  '/src/core/composables/',
  '/src/constants/',
  '/src/types/',
  '/src/utils/',
]);
const matchVbenUiCoreChunk = createChunkMatcher(['/src/core/ui/']);
const matchVbenCommonUiAuthChunk = createChunkMatcher([
  '/src/effects/common-ui/ui/authentication/',
  '/src/effects/common-ui/ui/fallback/',
]);
const matchVbenCommonUiDashboardChunk = createChunkMatcher([
  '/src/effects/common-ui/ui/about/',
  '/src/effects/common-ui/ui/dashboard/',
  '/src/effects/common-ui/ui/profile/',
]);
const matchVbenCommonUiCaptchaChunk = createChunkMatcher([
  '/src/effects/common-ui/components/captcha/',
]);
const matchVbenCommonUiEditorChunk = createChunkMatcher([
  '/src/effects/common-ui/components/code-mirror/',
  '/src/effects/common-ui/components/json-preview/',
  '/src/effects/common-ui/components/json-viewer/',
  '/src/effects/common-ui/components/markdown/',
  '/src/effects/common-ui/components/tippy/',
]);
const matchVbenCommonUiWidgetsChunk = createChunkMatcher([
  '/src/effects/common-ui/components/',
  '/src/effects/common-ui/index.ts',
  '/src/effects/common-ui/ui/index.ts',
]);
const matchVbenIconsChunk = createChunkMatcher(['/src/icons-app/']);
const matchVbenStylesChunk = createChunkMatcher(['/src/styles/']);
const matchVbenLayoutChunk = createChunkMatcher([
  '/src/effects/access/',
  '/src/effects/hooks/',
  '/src/effects/layouts/',
]);
const matchVbenStateChunk = createChunkMatcher([
  '/src/core/preferences/',
  '/src/locales/',
  '/src/stores/',
]);
const matchVbenRequestChunk = createChunkMatcher(['/src/effects/request/']);
const matchUtilsVendorChunk = createChunkMatcher(
  fromPnpm(
    '@intlify',
    'async-validator',
    'axios',
    'dayjs',
    'lodash-es',
    'mitt',
    'nprogress',
    'qs',
    'uuid',
    'zod',
  ),
);
const matchAppAuthChunk = createChunkMatcher([
  '/src/api/core/auth',
  '/src/api/core/captcha',
  '/src/views/_core/authentication/',
  '/src/views/_core/social-callback/',
]);
const matchAppLocaleChunk = createChunkMatcher(['/src/locales/']);
const matchAppCoreChunk = createChunkMatcher([
  '/src/adapter/',
  '/src/api/core/',
  '/src/bootstrap.ts',
  '/src/components/global/',
  '/src/layouts/',
  '/src/router/',
  '/src/stores/',
  '/src/utils/',
  '/src/views/_core/',
]);
const matchAppViewsChunk = createChunkMatcher(['/src/views/']);

function createApplicationCodeSplitting() {
  return {
    groups: [
      {
        name: 'antdv-icons',
        priority: 47,
        test: matchAntdvNextIconsChunk,
      },
      {
        name: 'antdv-theme',
        priority: 46,
        test: matchAntdvNextThemeChunk,
      },
      {
        name: 'antdv-form',
        priority: 45,
        test: matchAntdvNextFormChunk,
      },
      {
        name: 'antdv-overlay',
        priority: 44,
        test: matchAntdvNextOverlayChunk,
      },
      {
        name: 'antdv-data',
        priority: 43,
        test: matchAntdvNextDataChunk,
      },
      {
        name: 'antdv-layout',
        priority: 42,
        test: matchAntdvNextLayoutChunk,
      },
      {
        name: 'antdv-shared',
        priority: 41,
        test: matchAntdvNextSharedChunk,
      },
      {
        name: 'antdv-next',
        priority: 40,
        test: matchAntdvNextChunk,
      },
      {
        name: 'framework',
        priority: 30,
        test: matchFrameworkChunk,
      },
      {
        name: 'vben-core',
        priority: 24,
        test: matchVbenCoreChunk,
      },
      {
        name: 'vben-ui-core',
        priority: 23,
        test: matchVbenUiCoreChunk,
      },
      {
        name: 'vben-common-ui-auth',
        priority: 22,
        test: matchVbenCommonUiAuthChunk,
      },
      {
        name: 'vben-common-ui-dashboard',
        priority: 21,
        test: matchVbenCommonUiDashboardChunk,
      },
      {
        name: 'vben-common-ui-captcha',
        priority: 20,
        test: matchVbenCommonUiCaptchaChunk,
      },
      {
        name: 'vben-common-ui-editor',
        priority: 19,
        test: matchVbenCommonUiEditorChunk,
      },
      {
        name: 'vben-common-ui-widgets',
        priority: 18,
        test: matchVbenCommonUiWidgetsChunk,
      },
      {
        name: 'vben-icons',
        priority: 17,
        test: matchVbenIconsChunk,
      },
      {
        name: 'vben-styles',
        priority: 16,
        test: matchVbenStylesChunk,
      },
      {
        name: 'vben-layout',
        priority: 15,
        test: matchVbenLayoutChunk,
      },
      {
        name: 'vben-state',
        priority: 14,
        test: matchVbenStateChunk,
      },
      {
        name: 'vben-request',
        priority: 13,
        test: matchVbenRequestChunk,
      },
      {
        name: 'utils-vendor',
        priority: 5,
        test: matchUtilsVendorChunk,
      },
      {
        name: 'app-auth',
        priority: 4,
        test: matchAppAuthChunk,
      },
      {
        name: 'app-locales',
        priority: 3,
        test: matchAppLocaleChunk,
      },
      {
        name: 'app-core',
        priority: 2,
        test: matchAppCoreChunk,
      },
      {
        name: 'app-views',
        priority: 1,
        test: matchAppViewsChunk,
      },
    ],
  };
}

export { createApplicationCodeSplitting };
