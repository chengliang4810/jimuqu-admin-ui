import type { PluginOption } from 'vite';

import { lazyImport, VxeResolver } from 'vite-plugin-lazy-import';

/**
 * vxe-table / vxe-pc-ui 被 VxeResolver 改写成了按需子路径导入,
 * 而这些子路径都藏在懒加载路由里,vite 启动时的依赖预构建扫不到。
 * 结果:首次进入使用 vxe 的页面时 vite 才现场 optimize 这批子路径,
 * 打出 "dependencies optimized: ..." 并触发整页刷新(卡一下再刷)。
 *
 * 这里在 dev 阶段把这批子路径预声明进 optimizeDeps.include,
 * 让 server 启动时就一次性预构建,消除运行时的二次 optimize + full reload。
 */
const VXE_PREBUNDLE_ENTRIES = [
  'vxe-pc-ui/es/vxe-button/index.js',
  'vxe-pc-ui/es/vxe-checkbox/index.js',
  'vxe-pc-ui/es/vxe-icon/index.js',
  'vxe-pc-ui/es/vxe-input/index.js',
  'vxe-pc-ui/es/vxe-loading/index.js',
  'vxe-pc-ui/es/vxe-modal/index.js',
  'vxe-pc-ui/es/vxe-number-input/index.js',
  'vxe-pc-ui/es/vxe-pager/index.js',
  'vxe-pc-ui/es/vxe-radio-group/index.js',
  'vxe-pc-ui/es/vxe-select/index.js',
  'vxe-pc-ui/es/vxe-tooltip/index.js',
  'vxe-pc-ui/es/vxe-ui/index.js',
  'vxe-pc-ui/es/vxe-upload/index.js',
  'vxe-table/es/vxe-colgroup/index.js',
  'vxe-table/es/vxe-column/index.js',
  'vxe-table/es/vxe-grid/index.js',
  'vxe-table/es/vxe-table/index.js',
  'vxe-table/es/vxe-toolbar/index.js',
  'vxe-table/es/vxe-ui/index.js',
];

async function viteVxeTableImportsPlugin(): Promise<PluginOption> {
  return [
    lazyImport({
      resolvers: [
        VxeResolver({
          libraryName: 'vxe-table',
        }),
        VxeResolver({
          libraryName: 'vxe-pc-ui',
        }),
      ],
    }),
    {
      config() {
        return {
          optimizeDeps: {
            include: VXE_PREBUNDLE_ENTRIES,
          },
        };
      },
      name: 'vxe-table:prebundle',
    },
  ];
}

export { viteVxeTableImportsPlugin };
