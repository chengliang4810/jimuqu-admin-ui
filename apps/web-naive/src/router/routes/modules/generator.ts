import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ic:twotone-build',
      keepAlive: true,
      order: 8000,
      title: '系统工具',
    },
    name: 'Tool',
    path: '/tool',
    redirect: '/tool/gen-code',
    children: [
      {
        meta: {
          icon: 'ic:outline-code',
          title: '代码生成',
        },
        name: 'GenCode',
        path: '/tool/gen-code',
        component: () => import('#/views/tool/gen-code/index.vue'),
      },
      {
        meta: {
          icon: 'ic:twotone-layers',
          title: '代码模板',
        },
        name: 'GenCodeTemplate',
        path: '/tool/gen-code-template',
        component: () => import('#/views/tool/gen-template/index.vue'),
      },
    ],
  },
];

export default routes;
