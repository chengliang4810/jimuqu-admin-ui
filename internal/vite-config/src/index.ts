export {
  defineApplicationConfig,
  defineConfig,
  defineLibraryConfig,
} from './config';
export { getDefaultPwaOptions } from './options';
export {
  loadApplicationPlugins,
  loadLibraryPlugins,
  viteArchiverPlugin,
  viteCompressPlugin,
  viteDayjsPlugin,
  viteDtsPlugin,
  viteHtmlPlugin,
  viteVisualizerPlugin,
  viteVxeTableImportsPlugin,
} from './plugins';
export type {
  ApplicationPluginOptions,
  ArchiverPluginOptions,
  CommonPluginOptions,
  ConditionPlugin,
  DefineApplicationOptions,
  DefineConfig,
  DefineLibraryOptions,
  HtmlPluginOptions,
  LibraryPluginOptions,
  PrintPluginOptions,
  VbenViteConfig,
} from './typing';
export { loadAndConvertEnv } from './utils/env';
