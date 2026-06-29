import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@/components/access';
import { setupGlobalComponent } from '@/components/global';
import { registerLoadingDirective } from '@/components/loading';
import { preferences } from '@/core/preferences';
import { $t, setupI18n } from '@/locales';
import { initStores } from '@/stores';
import { useTitle } from '@vueuse/core';

import App from './app.vue';
import { router } from './router';
import { initPopupContext } from './utils/context';

import '@/styles';

import '@/styles/antdv-next/index.css';

async function bootstrap(namespace: string) {
  const app = createApp(App);

  // 全局组件
  setupGlobalComponent(app);
  // 注册v-loading指令
  registerLoadingDirective(app, {
    loading: 'loading', // 在这里可以自定义指令名称，也可以明确提供false表示不注册这个指令
    spinning: 'spinning',
  });

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-tore
  await initStores(app, { namespace });

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化全局弹窗方法(静态API fallback, 防止路由守卫中访问undefined)
  initPopupContext();

  // 配置路由及路由守卫
  app.use(router);

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
