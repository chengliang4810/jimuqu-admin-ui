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
const matchAntdvNextMarkdownChunk = createChunkMatcher(
  fromPnpm('@antdv-next/x-markdown'),
);
const matchAntdvNextChunk = createChunkMatcher(['antdv-next']);
const matchFrameworkChunk = createChunkMatcher(
  fromPnpm('@vue', '@vueuse', 'pinia', 'vue-router', 'vue'),
);
// 重型第三方库 vendor 分组。注意优先级分两档(见下方 groups):
// - crypto/utils 等首屏依赖 → 高优先级,先 claim 独占 chunk;
// - editor/chart/vxe/codemirror/jsoneditor/motion 仅懒加载路由用 → 低优先级,
//   让首屏共享依赖先被高优先级组占走,避免其借递归把首屏依赖顺进重型 chunk。
const matchVxeVendorChunk = createChunkMatcher(
  fromPnpm('vxe-table', 'vxe-pc-ui', '@vxe-ui', 'xe-utils', 'dom-zindex'),
);
const matchChartVendorChunk = createChunkMatcher(fromPnpm('echarts', 'zrender'));
const matchEditorVendorChunk = createChunkMatcher([
  'prosemirror-',
  '@tiptap/',
  'linkifyjs',
  '/src/components/tiptap/',
]);
const matchCodemirrorVendorChunk = createChunkMatcher(
  fromPnpm('@codemirror', '@lezer'),
);
const matchJsoneditorVendorChunk = createChunkMatcher(
  fromPnpm('vanilla-jsoneditor', 'json-editor-vue', 'jsonpath-plus', 'jmespath'),
);
const matchCryptoVendorChunk = createChunkMatcher(
  fromPnpm('crypto-js', 'jsencrypt', 'sm-crypto'),
);
const matchMotionVendorChunk = createChunkMatcher(fromPnpm('motion-v'));
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
    '@alova/adapter-axios',
    '@ctrl/tinycolor',
    '@iconify/vue',
    '@intlify',
    'alova',
    'async-validator',
    'axios',
    'cropperjs',
    'dayjs',
    'lodash-es',
    'lz-string',
    'mitt',
    'nprogress',
    'qs',
    'secure-ls',
    'uuid',
    'vue-json-pretty',
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
        name: 'antdv-x-markdown',
        priority: 48,
        test: matchAntdvNextMarkdownChunk,
      },
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
        // crypto 登录即用,属首屏;高优先级确保其独占 chunk,
        // 不被下方懒加载 vendor 组(递归)顺走或污染
        name: 'crypto-vendor',
        priority: 34,
        test: matchCryptoVendorChunk,
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
        priority: 31,
        test: matchUtilsVendorChunk,
      },
      // 以下为"仅懒加载路由使用"的重型 vendor: 优先级必须低于上方所有
      // 首屏组(framework/utils-vendor/crypto-vendor/vben-*),这样首屏共享依赖
      // (core/ui、icons、crypto、axios、lodash、vue-router 等)先被各自高优先级组 claim,
      // 这些组就无法借递归顺走首屏依赖 → 整个重型 chunk 保持懒加载、不进首屏。
      // 同时高于 app-*(2/1),避免被按路由拆分的 app-views/app-core 吸收。
      {
        name: 'editor-vendor',
        priority: 12,
        test: matchEditorVendorChunk,
      },
      {
        name: 'jsoneditor-vendor',
        priority: 11,
        test: matchJsoneditorVendorChunk,
      },
      {
        name: 'codemirror-vendor',
        priority: 10,
        test: matchCodemirrorVendorChunk,
      },
      {
        name: 'chart-vendor',
        priority: 9,
        test: matchChartVendorChunk,
      },
      {
        name: 'vxe-vendor',
        priority: 8,
        test: matchVxeVendorChunk,
      },
      {
        name: 'motion-vendor',
        priority: 7,
        test: matchMotionVendorChunk,
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
        // entriesAware: 按"被哪些路由 entry 使用"拆分共享代码,
        // 避免所有页面合并成单个巨型 chunk
        entriesAware: true,
        name: 'app-core',
        priority: 2,
        test: matchAppCoreChunk,
      },
      {
        entriesAware: true,
        name: 'app-views',
        priority: 1,
        test: matchAppViewsChunk,
      },
    ],
  };
}

export { createApplicationCodeSplitting };
