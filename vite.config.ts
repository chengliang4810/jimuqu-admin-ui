import { resolve } from 'node:path';
import process from 'node:process';

import { createApiProxy } from './build/vite/config/api-proxy';
import { defineConfig } from './build/vite/index';

// 自行取消注释来启用按需导入功能
// import { AntdvNextResolver } from '@antdv-next/auto-import-resolver'
// import Components from 'unplugin-vue-components/vite';

export default defineConfig(async () => {
  const playwrightApiUrl = process.env.PLAYWRIGHT_API_URL;

  return {
    application: {},
    vite: {
      plugins: [
        // Components({
        //   dirs: [], // 默认会导入src/components目录下所有组件 不需要
        //   dts: './types/components.d.ts', // 输出类型文件
        //   resolvers: [
        //     AntdvNextResolver({
        //       // 需要排除Button组件 全局已经默认导入了
        //       exclude: ['Button'],
        //     }),
        //   ],
        // }),
      ],
      resolve: {
        alias: {
          '@': resolve(import.meta.dirname, 'src'),
        },
      },
      preview: playwrightApiUrl
        ? {
            proxy: createApiProxy('/prod-api', playwrightApiUrl),
          }
        : undefined,
      server: {
        proxy: createApiProxy('/dev-api', 'http://127.0.0.1:5320'),
      },
    },
  };
});
