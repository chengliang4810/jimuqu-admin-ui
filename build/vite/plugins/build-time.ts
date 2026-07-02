import type { PluginOption } from 'vite';

import { version as viteVersion } from 'vite';

import { colors } from '../utils';

/**
 * 打包耗时统计插件
 * 在构建开始时记时，构建结束(closeBundle)时输出总耗时
 */
export const viteBuildTimePlugin = (): PluginOption => {
  let startTime = 0;

  return {
    apply: 'build',
    buildStart() {
      startTime = Date.now();
    },
    closeBundle: {
      handler() {
        const cost = Date.now() - startTime;
        const seconds = (cost / 1000).toFixed(2);
        console.log(
          `\n  ${colors.green('➜')}  ${colors.bold(`vite v${viteVersion}`)}  ${colors.bold('构建耗时')}: ${colors.cyan(`${seconds}s`)}\n`,
        );
      },
      order: 'post',
    },
    enforce: 'post',
    name: 'vite:build-time',
  };
};
