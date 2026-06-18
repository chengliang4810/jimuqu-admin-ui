// 库级 widgets（无命名冲突，全部导出）
export * from './widgets';
// 库级 iframe 路由视图（IFrameView 由应用包装器导出，此处仅导出 IFrameRouterView）
export { default as IFrameRouterView } from './iframe/iframe-router-view.vue';

// 应用级布局包装器（作为公共 API，优先于同名库组件）
export { default as AuthPageLayout } from './auth.vue';
export { default as BasicLayout } from './basic.vue';
export { default as IFrameView } from './iframe/iframe-view.vue';
