const createChunkMatcher = (patterns: string[]) => {
  return (id: string) => {
    const normalizedId = id.includes('\\') ? id.replaceAll('\\', '/') : id;
    return patterns.some((pattern) => normalizedId.includes(pattern));
  };
};

const APP_VIEWS_MERGE_THRESHOLD = 12 * 1024;

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
  ),
  ...fromAntdvDist('config-provider', 'locale', 'style', 'theme'),
]);
const matchAntdvNextFormChunk = createChunkMatcher(
  fromAntdvDist(
    'checkbox',
    'color-picker',
    'form',
    'input-number',
    'input',
    'select',
    'slider',
    'switch',
  ),
);
// 仅业务页面使用的表单组件，不进首屏
const matchAntdvNextFormExtChunk = createChunkMatcher(
  fromAntdvDist(
    'auto-complete',
    'calendar',
    'cascader',
    'date-picker',
    'mentions',
    'radio',
    'rate',
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
const matchAntdvNextVendorChunk = (id: string) =>
  !matchAntdvNextMarkdownChunk(id) &&
  (matchAntdvNextIconsChunk(id) ||
    matchAntdvNextThemeChunk(id) ||
    matchAntdvNextFormChunk(id) ||
    matchAntdvNextOverlayChunk(id) ||
    matchAntdvNextDataChunk(id) ||
    matchAntdvNextLayoutChunk(id) ||
    matchAntdvNextFormExtChunk(id) ||
    matchAntdvNextSharedChunk(id) ||
    matchAntdvNextChunk(id));
const matchFrameworkChunk = createChunkMatcher(
  fromPnpm(
    '@vue',
    '@vueuse',
    'pinia',
    'pinia-plugin-persistedstate',
    'vue-router',
    'vue',
  ),
);
// 重型第三方库 vendor 分组。注意优先级分两档(见下方 groups):
// - crypto/utils 等首屏依赖 → 高优先级,先 claim 独占 chunk;
// - editor/chart/vxe/codemirror/jsoneditor/motion 仅懒加载路由用 → 低优先级,
//   让首屏共享依赖先被高优先级组占走,避免其借递归把首屏依赖顺进重型 chunk。
const matchVxeVendorChunk = createChunkMatcher([
  ...fromPnpm('vxe-table', 'vxe-pc-ui', '@vxe-ui', 'xe-utils', 'dom-zindex'),
  '/src/components/vxe-table/',
]);
const matchChartVendorChunk = createChunkMatcher(
  fromPnpm('echarts', 'zrender'),
);
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
  fromPnpm(
    'vanilla-jsoneditor',
    'json-editor-vue',
    'jsonpath-plus',
    'jmespath',
  ),
);
const matchCryptoVendorChunk = createChunkMatcher(
  fromPnpm('crypto-js', 'jsencrypt', 'sm-crypto'),
);
const matchMotionVendorChunk = createChunkMatcher(fromPnpm('motion-v'));
const matchVbenCoreChunk = createChunkMatcher([
  '/src/core/shared/',
  '/src/styles/design/',
  '/src/core/composables/',
  '/src/core/ui/',
  '/src/constants/',
  '/src/styles/',
  '/src/types/',
  '/src/utils/',
]);
const matchVbenCommonUiAuthChunk = createChunkMatcher([
  '/src/effects/common-ui/ui/authentication/',
  '/src/components/fallback/',
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
  '/src/components/json-preview/',
  '/src/effects/common-ui/components/json-viewer/',
  '/src/effects/common-ui/components/markdown/',
  '/src/effects/common-ui/components/tippy/',
]);
const matchVbenCommonUiWidgetsChunk = createChunkMatcher([
  '/src/components/loading/',
  '/src/components/page/',
]);
const matchVbenIconsChunk = createChunkMatcher(['/src/icons/']);
const matchVbenLayoutChunk = createChunkMatcher([
  '/src/components/access/',
  '/src/hooks/',
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
    'lodash-es',
    'lz-string',
    'mitt',
    'nprogress',
    'qs',
    'secure-ls',
    'uuid',
    'zod',
  ),
);
// dayjs 必须独立成首屏 vendor:i18n/notify 等首屏模块静态依赖它,
// 但 date-picker/picker(form-ext)也大量 import dayjs。若不单独高优先级 claim,
// rolldown 会按"消费方聚类"把 dayjs 拉进 form-ext,反过来把整个 form-ext 钉进首屏。
const matchDayjsVendorChunk = createChunkMatcher(fromPnpm('dayjs'));
// 仅在懒加载页面使用的工具库，独立拆包避免污染首屏 utils-vendor
const matchLazyUtilsVendorChunk = createChunkMatcher(
  fromPnpm(
    'cropperjs',
    'vue-json-pretty',
    'vanilla-jsoneditor',
    'json-editor-vue',
    'jsonpath-plus',
    'jmespath',
  ),
);
const matchAppAuthChunk = createChunkMatcher([
  '/src/api/core/auth',
  '/src/api/core/captcha',
  '/src/layouts/auth.vue',
  '/src/layouts/authentication/',
  '/src/views/_core/authentication/',
  '/src/views/_core/oauth-common',
  '/src/views/_core/social-callback/',
]);
const matchAppLocaleChunk = createChunkMatcher(['/src/locales/']);
const matchAppWorkflowComponentsChunk = createChunkMatcher([
  '/src/views/workflow/components/approval-',
  '/src/views/workflow/components/flow-preview.vue',
  '/src/views/workflow/components/user-select-',
]);
const matchAppViewsChunk = createChunkMatcher(['/src/views/']);

function createApplicationCodeSplitting() {
  return {
    groups: [
      {
        // Vue/runtime 必须最先 claim。否则懒加载库如果优先级更高,
        // 会把 Vue helper 递归带进自己的 chunk,反过来钉到首屏 preload。
        name: 'framework',
        priority: 60,
        test: matchFrameworkChunk,
      },
      {
        // 优先级压过所有 antdv 组件组(icons 47 ~ next 39),
        // 确保 dayjs 被独立 claim 而非被 form-ext 等消费方聚走
        name: 'dayjs-vendor',
        priority: 50,
        test: matchDayjsVendorChunk,
      },
      {
        name: 'antdv-vendor',
        priority: 47,
        test: matchAntdvNextVendorChunk,
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
      {
        name: 'lazy-utils-vendor',
        priority: 6,
        test: matchLazyUtilsVendorChunk,
      },
      {
        // 仅更新日志懒加载使用。必须低于 framework/antdv 组件组,
        // 避免递归抢走 Vue 或 antdv 公共依赖后进入首屏。
        name: 'antdv-x-markdown',
        priority: 5,
        test: matchAntdvNextMarkdownChunk,
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
        name: 'app-workflow-components',
        priority: 4,
        test: matchAppWorkflowComponentsChunk,
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
        entriesAware: true,
        entriesAwareMergeThreshold: APP_VIEWS_MERGE_THRESHOLD,
        name: 'app-views',
        priority: 1,
        test: matchAppViewsChunk,
      },
    ],
  };
}

export { createApplicationCodeSplitting };
