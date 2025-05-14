import { defineConfig } from '@vben/vite-config';

import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        AutoImport({
          imports: [
            'vue',
            'vue-router',
            {
              'naive-ui': [
                'useDialog',
                'useMessage',
                'useNotification',
                'useLoadingBar',
              ],
              '#/adapter/vxe-table': ['useVbenVxeGrid', 'VxeTableColumn'],
              '#/adapter/form': ['useVbenForm'],
            },
            {
              from: '#/adapter/vxe-table',
              imports: ['VxeGridProps'],
              type: true,
            },
            {
              from: '#/adapter/form',
              imports: ['VbenFormProps'],
              type: true,
            },
          ],
          dts: './src/types/auto-imports.d.ts',
          dirs: [
            // 移除这里的@vben/common-ui，避免重复导入
            // '@vben/common-ui',
            // {
            //   glob: '#/adapter/form',
            //   types: true,
            // },
            // {
            //   glob: ' #/adapter/vxe-table',
            //   types: true,
            // },
          ],
        }),
        Components({
          resolvers: [NaiveUiResolver()],
          include: [/\.tsx$/, /\.vue$/, /\.vue\?vue/],
          dts: './src/types/components.d.ts',
          deep: true,
        }),
      ],
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            target: 'http://localhost:5320',
            ws: true,
          },
        },
      },
    },
  };
});
