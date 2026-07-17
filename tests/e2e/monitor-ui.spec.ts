import { expect, test } from './fixtures';
import { expectSuccessEnvelope, waitForApiResponse } from './helpers/api';
import { dataRow } from './helpers/crud';
import { openDynamicModule } from './helpers/navigation';

test('operation log details open from the web table without clearing logs', async ({
  authenticatedPage: page,
}) => {
  await openDynamicModule(page, {
    heading: '操作日志列表',
    item: '操作日志',
    parent: '系统监控',
    responseKind: 'page',
    responsePath: '/monitor/operlog/list',
    url: /\/monitor\/operlog(?:[/?#]|$)/,
  });

  const firstRow = page.locator('.vxe-body--row').first();
  await expect(firstRow).toBeVisible();
  await firstRow.getByText('预览', { exact: true }).click();
  const drawer = page.getByRole('dialog').last();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('查看日志', { exact: true })).toBeVisible();
});

test('login log details open from the web table without deleting logs', async ({
  authenticatedPage: page,
}) => {
  await openDynamicModule(page, {
    heading: '登录日志列表',
    item: '登录日志',
    parent: '系统监控',
    responseKind: 'page',
    responsePath: '/monitor/loginInfo/list',
    url: /\/monitor\/loginInfo(?:[/?#]|$)/,
  });

  const firstRow = page.locator('.vxe-body--row').first();
  await expect(firstRow).toBeVisible();
  await firstRow.getByText('详情', { exact: true }).click();
  const modal = page.getByRole('dialog').last();
  await expect(modal).toBeVisible();
  await expect(modal.getByText('登录日志', { exact: true })).toBeVisible();
});

test('online session page shows the current user but never forces it offline', async ({
  authenticatedPage: page,
}) => {
  await openDynamicModule(page, {
    heading: '在线用户列表',
    item: '在线用户',
    parent: '系统监控',
    responseKind: 'page',
    responsePath: '/monitor/online/list',
    url: /\/monitor\/online(?:[/?#]|$)/,
  });

  const currentSession = dataRow(page, 'admin');
  await expect(currentSession).toBeVisible();
  await expect(
    currentSession.getByRole('button', { name: '强制下线' }),
  ).toBeVisible();
});

test('cache monitor refreshes Redis information from the web UI', async ({
  authenticatedPage: page,
}) => {
  await openDynamicModule(page, {
    heading: 'redis信息',
    item: '缓存监控',
    parent: '系统监控',
    responseKind: 'object',
    responsePath: '/monitor/cache',
    url: /\/monitor\/cache(?:[/?#]|$)/,
  });

  const redisCard = page.locator('.ant-card').filter({ hasText: 'redis信息' });
  const refreshResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/monitor/cache',
  );
  await redisCard.getByRole('button').click();
  const envelope = await expectSuccessEnvelope<{
    commandStats: unknown[];
    dbSize: number;
    info: Record<string, string>;
  }>(await refreshResponsePromise, 'refresh Redis monitor');
  expect(Array.isArray(envelope.data.commandStats)).toBe(true);
  expect(typeof envelope.data.dbSize).toBe('number');
  expect(envelope.data.info).toEqual(expect.any(Object));
});
