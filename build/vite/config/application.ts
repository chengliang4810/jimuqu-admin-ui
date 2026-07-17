import type { CSSOptions, UserConfig } from 'vite';

import type { DefineApplicationOptions } from '../typing';

import path, { relative } from 'node:path';

import { NodePackageImporter } from 'sass-embedded';
import { defineConfig, loadEnv, mergeConfig } from 'vite';

import { loadApplicationPlugins } from '../plugins';
import { findMonorepoRoot } from '../utils';
import { loadAndConvertEnv } from '../utils/env';
import { createApplicationCodeSplitting } from './code-split';
import { getCommonConfig } from './common';

function defineApplicationConfig(userConfigPromise?: DefineApplicationOptions) {
  return defineConfig(async (config) => {
    const options = await userConfigPromise?.(config);
    const { base, port, ...envConfig } = await loadAndConvertEnv();
    const { command, mode } = config;
    const { application = {}, vite = {} } = options || {};
    const root = process.cwd();
    const isBuild = command === 'build';
    const env = loadEnv(mode, root);

    const plugins = await loadApplicationPlugins({
      archiver: true,
      archiverPluginOptions: {},
      compress: false,
      compressTypes: ['brotli', 'gzip'],
      devtools: true,
      env,
      extraAppConfig: true,
      html: true,
      i18n: true,
      injectAppLoading: true,
      injectMetadata: true,
      isBuild,
      license: true,
      mode,
      print: !isBuild,
      printInfoMap: {
        'Repository link': 'https://github.com/chengliang4810/jimuqu-admin-ui',
      },
      vxeTableLazyImport: true,
      ...envConfig,
      ...application,
    });

    const { injectGlobalScss = true } = application;

    const applicationConfig: UserConfig = {
      base,
      build: {
        rolldownOptions: {
          /**
           * TODO: 等待vueuse的打包warning解决 这里可以去除
           */
          onLog(level, log, defaultHandler) {
            if (log.code === 'INVALID_ANNOTATION') {
              return;
            }
            defaultHandler(level, log);
          },
          output: {
            assetFileNames: '[ext]/[name]-[hash].[ext]',
            chunkFileNames: 'js/[name]-[hash].js',
            codeSplitting: createApplicationCodeSplitting(),
            entryFileNames: 'jse/index-[name]-[hash].js',
            minify: isBuild
              ? {
                  compress: {
                    dropDebugger: true,
                  },
                }
              : false,
          },
        },
        // Tailwind v4 已将实际浏览器基线抬到 Chrome111/Safari16.4（依赖 color-mix/@property/@layer，
        // 无法 polyfill 降级），故 JS target 对齐现代基线，同时消除 BigInt 字面量(0n)无法降级的警告
        target: 'es2022',
      },
      css: createCssOptions(injectGlobalScss),
      plugins,
      server: {
        host: true,
        port,
        warmup: {
          // 预热文件
          clientFiles: [
            './index.html',
            './src/bootstrap.ts',
            './src/{views,layouts,router,stores,api,adapter}/*',
          ],
        },
      },
    };

    const mergedCommonConfig = mergeConfig(
      await getCommonConfig(),
      applicationConfig,
    );
    return mergeConfig(mergedCommonConfig, vite);
  });
}

function createCssOptions(injectGlobalScss = true): CSSOptions {
  const root = findMonorepoRoot();
  return {
    preprocessorOptions: injectGlobalScss
      ? {
          scss: {
            additionalData: (content: string, filepath: string) => {
              const relativePath = relative(root, filepath);
              // 应用源码(根 src 目录)注入全局样式
              if (
                relativePath.startsWith(`src${path.sep}`) ||
                relativePath.startsWith(`apps${path.sep}`)
              ) {
                return `@use "src/styles/global" as *;\n${content}`;
              }
              return content;
            },
            importers: [new NodePackageImporter()],
            loadPaths: ['.'],
          },
        }
      : {},
  };
}

export { defineApplicationConfig };
