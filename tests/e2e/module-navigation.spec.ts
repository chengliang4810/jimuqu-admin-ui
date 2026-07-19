import type { DynamicModule } from './helpers/navigation';

import { expect, test } from './fixtures';
import { openDynamicModule } from './helpers/navigation';

const modules: DynamicModule[] = [
  {
    heading: '角色列表',
    item: '角色管理',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/system/role/list',
    url: /\/system\/role(?:[/?#]|$)/,
  },
  {
    heading: '菜单列表',
    item: '菜单管理',
    parent: '系统管理',
    responseKind: 'list',
    responsePath: '/system/menu/list',
    url: /\/system\/menu(?:[/?#]|$)/,
  },
  {
    heading: '部门列表',
    item: '部门管理',
    parent: '系统管理',
    responseKind: 'list',
    responsePath: '/system/dept/list',
    url: /\/system\/dept(?:[/?#]|$)/,
  },
  {
    heading: '岗位列表',
    item: '岗位管理',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/system/post/list',
    url: /\/system\/post(?:[/?#]|$)/,
  },
  {
    heading: '字典类型列表',
    item: '字典管理',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/system/dict/type/list',
    url: /\/system\/dict(?:[/?#]|$)/,
  },
  {
    heading: '参数列表',
    item: '参数设置',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/system/config/list',
    url: /\/system\/config(?:[/?#]|$)/,
  },
  {
    heading: '通知公告列表',
    item: '通知公告',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/system/notice/list',
    url: /\/system\/notice(?:[/?#]|$)/,
  },
  {
    heading: '客户端列表',
    item: '客户端管理',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/system/client/list',
    url: /\/system\/client(?:[/?#]|$)/,
  },
  {
    heading: '文件列表',
    item: '文件管理',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/resource/oss/list',
    url: /\/system\/oss(?:[/?#]|$)/,
  },
  {
    heading: '在线用户列表',
    item: '在线用户',
    parent: '系统监控',
    responseKind: 'page',
    responsePath: '/monitor/online/list',
    url: /\/monitor\/online(?:[/?#]|$)/,
  },
  {
    ancestor: '系统管理',
    heading: '操作日志列表',
    item: '操作日志',
    parent: '日志管理',
    responseKind: 'page',
    responsePath: '/monitor/operlog/list',
    url: /\/system\/log\/operlog(?:[/?#]|$)/,
  },
  {
    ancestor: '系统管理',
    heading: '登录日志列表',
    item: '登录日志',
    parent: '日志管理',
    responseKind: 'page',
    responsePath: '/monitor/loginInfo/list',
    url: /\/system\/log\/logininfo(?:[/?#]|$)/,
  },
  {
    heading: 'redis信息',
    item: '缓存监控',
    parent: '系统监控',
    responseKind: 'object',
    responsePath: '/monitor/cache',
    url: /\/monitor\/cache(?:[/?#]|$)/,
  },
];

for (const module of modules) {
  test(`${module.item} opens from the backend menu with a valid response contract`, async ({
    authenticatedPage,
  }) => {
    const envelope = await openDynamicModule(authenticatedPage, module);
    expect(envelope.code).toBe(200);
  });
}
