import type { RouteRecordRaw } from 'vue-router';

import { IFrameView } from '@/layouts';
import { $t } from '@/locales';

const {
  version,
  // vite inject-metadata 插件注入的全局变量
} = __VBEN_ADMIN_METADATA__ || {};

const routes: RouteRecordRaw[] = [
  {
    meta: {
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/analytics',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: () => import('@/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: true,
          title: $t('page.dashboard.analytics'),
        },
      },
      {
        name: 'VbenDocument',
        path: '/vben-admin/document',
        component: IFrameView,
        meta: {
          icon: 'lucide:book-open-text',
          iframeSrc: 'https://dapdap.top',
          keepAlive: true,
          title: $t('demos.vben.document'),
        },
      },
      {
        name: 'ChangeLog',
        path: '/changelog',
        component: () => import('@/views/_core/changelog/index.vue'),
        meta: {
          icon: 'lucide:book-open-text',
          keepAlive: true,
          title: '更新日志',
          badge: `当前: ${version}`,
          badgeVariants: 'bg-primary',
        },
      },
    ],
  },
  {
    component: () => import('@/views/_core/about/index.vue'),
    meta: {
      icon: 'lucide:copyright',
      order: 9999,
      title: $t('demos.vben.about'),
    },
    name: 'About',
    path: '/vben-admin/about',
  },
];

export default routes;
