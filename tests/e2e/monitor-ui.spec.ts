import type { Page } from 'playwright/test';

import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import {
  antButtonNames,
  confirmRowDelete,
  dataRow,
  titledGrid,
} from './helpers/crud';
import { expectExcelExport } from './helpers/download';
import { fillLabeledInput, formItem } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

async function changeLoginLogPageSize(page: Page, pageSize: number) {
  const responsePromise = waitForApiResponse(
    page,
    'GET',
    '/monitor/loginInfo/list',
  );
  await titledGrid(page, '登录日志列表').locator('.vxe-pager--sizes').click();
  await page
    .locator('.vxe-select--panel:visible .vxe-select-option')
    .filter({ hasText: `${pageSize}条/页` })
    .click();
  const response = await responsePromise;
  const requestUrl = new URL(response.url());
  expect(requestUrl.searchParams.get('pageNum')).toBe('1');
  expect(requestUrl.searchParams.get('pageSize')).toBe(String(pageSize));
  return expectPageEnvelope(response, `login log page size ${pageSize}`);
}

async function confirmTypedClear(page: Page) {
  const modal = page
    .getByRole('dialog')
    .filter({ hasText: '确认删除后将无法恢复，请谨慎操作！' })
    .last();
  await expect(modal).toBeVisible();
  await modal.locator('input').fill('确认删除');
  await modal
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();
}

test('operation log details open from the web table without clearing logs', async ({
  authenticatedPage: page,
}) => {
  await openDynamicModule(page, {
    ancestor: '系统管理',
    heading: '操作日志列表',
    item: '操作日志',
    parent: '日志管理',
    responseKind: 'page',
    responsePath: '/monitor/operlog/list',
    url: /\/system\/log\/operlog(?:[/?#]|$)/,
  });

  const firstRow = page.locator('.vxe-body--row').first();
  await expect(firstRow).toBeVisible();
  await firstRow.getByText('预览', { exact: true }).click();
  const drawer = page.getByRole('dialog').last();
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('查看日志', { exact: true })).toBeVisible();
});

test('operation logs export, batch delete and clear through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  await openDynamicModule(page, {
    ancestor: '系统管理',
    heading: '操作日志列表',
    item: '操作日志',
    parent: '日志管理',
    responseKind: 'page',
    responsePath: '/monitor/operlog/list',
    url: /\/system\/log\/operlog(?:[/?#]|$)/,
  });

  await expectExcelExport(
    page,
    '/monitor/operlog/export',
    'export operation logs',
  );

  const firstRow = page.locator('.vxe-body--row').first();
  await expect(firstRow, 'operation log to delete').toBeVisible();
  await firstRow.locator('.vxe-cell--checkbox').click();
  const deleteButton = titledGrid(page, '操作日志列表').getByRole('button', {
    name: antButtonNames.delete,
  });
  await expect(deleteButton).toBeEnabled();
  const deletePromise = waitForApiResponse(
    page,
    'DELETE',
    /\/monitor\/operlog\/[^/]+$/,
  );
  const deleteReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/monitor/operlog/list',
  );
  await deleteButton.click();
  const deleteConfirm = page
    .getByRole('dialog')
    .filter({ hasText: '确认删除选中的1条操作日志吗？' })
    .last();
  await expect(deleteConfirm).toBeVisible();
  await deleteConfirm
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();
  await expectSuccessEnvelope(await deletePromise, 'delete operation log');
  await expectPageEnvelope(
    await deleteReloadPromise,
    'reload deleted operation log',
  );

  const clearPromise = waitForApiResponse(
    page,
    'DELETE',
    '/monitor/operlog/clean',
  );
  const clearReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/monitor/operlog/list',
  );
  await titledGrid(page, '操作日志列表')
    .getByRole('button', { name: antButtonNames.clear })
    .click();
  await confirmTypedClear(page);
  await expectSuccessEnvelope(await clearPromise, 'clear operation logs');
  await expectPageEnvelope(
    await clearReloadPromise,
    'reload cleared operation logs',
  );
});

test('login log details open from the web table without deleting logs', async ({
  authenticatedPage: page,
}) => {
  await openDynamicModule(page, {
    ancestor: '系统管理',
    heading: '登录日志列表',
    item: '登录日志',
    parent: '日志管理',
    responseKind: 'page',
    responsePath: '/monitor/loginInfo/list',
    url: /\/system\/log\/logininfo(?:[/?#]|$)/,
  });

  const firstRow = page.locator('.vxe-body--row').first();
  await expect(firstRow).toBeVisible();
  await firstRow.getByText('详情', { exact: true }).click();
  const modal = page.getByRole('dialog').last();
  await expect(modal).toBeVisible();
  await expect(modal.getByText('登录日志', { exact: true })).toBeVisible();
});

test('login logs export and clear through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  await openDynamicModule(page, {
    ancestor: '系统管理',
    heading: '登录日志列表',
    item: '登录日志',
    parent: '日志管理',
    responseKind: 'page',
    responsePath: '/monitor/loginInfo/list',
    url: /\/system\/log\/logininfo(?:[/?#]|$)/,
  });

  await expectExcelExport(
    page,
    '/monitor/loginInfo/export',
    'export login logs',
  );

  const clearPromise = waitForApiResponse(
    page,
    'DELETE',
    '/monitor/loginInfo/clean',
  );
  const clearReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/monitor/loginInfo/list',
  );
  await titledGrid(page, '登录日志列表')
    .getByRole('button', { name: antButtonNames.clear })
    .click();
  await confirmTypedClear(page);
  await expectSuccessEnvelope(await clearPromise, 'clear login logs');
  await expectPageEnvelope(
    await clearReloadPromise,
    'reload cleared login logs',
  );
});

test('a failed real login is paged, unlocked and removed through the web UI', async ({
  authenticatedSession,
  browser,
  request,
}) => {
  test.setTimeout(180_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  const failedContext = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:15555',
  });
  const failedPage = await failedContext.newPage();
  const consoleErrors: string[] = [];
  const resourceFailures: string[] = [];
  const runtimeErrors: string[] = [];
  let failedInfoId: string | undefined;
  let removed = false;

  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();
  failedPage.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  failedPage.on('requestfailed', (failedRequest) => {
    if (
      ['font', 'image', 'script', 'stylesheet'].includes(
        failedRequest.resourceType(),
      )
    ) {
      resourceFailures.push(
        `${failedRequest.method()} ${failedRequest.url()} ${failedRequest.failure()?.errorText ?? 'failed'}`,
      );
    }
  });
  failedPage.on('pageerror', (error) => {
    runtimeErrors.push(`pageerror: ${error.message}`);
  });
  failedPage.on('response', (response) => {
    if (response.status() >= 500) {
      runtimeErrors.push(
        `${response.status()} ${response.request().method()} ${response.url()}`,
      );
    } else if (
      response.status() >= 400 &&
      ['font', 'image', 'script', 'stylesheet'].includes(
        response.request().resourceType(),
      )
    ) {
      resourceFailures.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await failedPage.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await failedPage.locator('#username').fill('no_permission');
    await failedPage.locator('#password').fill('DefinitelyWrong123!');
    const failedLoginPromise = waitForApiResponse(
      failedPage,
      'POST',
      '/auth/login',
    );
    await failedPage.getByRole('button', { name: 'login' }).click();
    const failedLoginResponse = await failedLoginPromise;
    expect(failedLoginResponse.ok()).toBe(true);
    const failedLogin = (await failedLoginResponse.json()) as {
      code: number;
      data: null;
      msg: string;
    };
    expect(failedLogin.code).not.toBe(200);
    expect(failedLogin.data).toBeNull();
    await expect(failedPage).toHaveURL(/\/auth\/login(?:[/?#]|$)/);
    await expect(
      failedPage.getByRole('alert').filter({ hasText: failedLogin.msg }).last(),
    ).toBeVisible();
    expect(consoleErrors, 'failed-login console diagnostics').toEqual([]);
    expect(runtimeErrors, 'failed-login runtime diagnostics').toEqual([]);
    expect(resourceFailures, 'failed-login resource diagnostics').toEqual([]);
    await failedContext.close();

    await openDynamicModule(page, {
      ancestor: '系统管理',
      heading: '登录日志列表',
      item: '登录日志',
      parent: '日志管理',
      responseKind: 'page',
      responsePath: '/monitor/loginInfo/list',
      url: /\/system\/log\/logininfo(?:[/?#]|$)/,
    });
    await changeLoginLogPageSize(page, 20);

    await fillLabeledInput(page, '用户账号', 'no_permission');
    const searchForm = formItem(page, '用户账号').locator(
      'xpath=ancestor::form[1]',
    );
    let failedLog:
      | undefined
      | { infoId: string; msg: string; status: string; userName: string };
    await expect(async () => {
      const searchPromise = waitForApiResponse(
        page,
        'GET',
        '/monitor/loginInfo/list',
      );
      await searchForm
        .getByRole('button', { name: antButtonNames.search })
        .click();
      const logs = await expectPageEnvelope<{
        infoId: string;
        msg: string;
        status: string;
        userName: string;
      }>(await searchPromise, 'search failed login log');
      failedLog = logs.data.rows.find(
        (row) => row.userName === 'no_permission' && row.status === '1',
      );
      expect(failedLog, 'new failed login log').toBeTruthy();
    }).toPass({ intervals: [200, 500, 1000], timeout: 10_000 });
    if (!failedLog) throw new Error('failed login log is missing');
    failedInfoId = failedLog.infoId;

    let failedRow = page
      .locator('.vxe-body--row')
      .filter({ hasText: 'no_permission' })
      .filter({ hasText: failedLog.msg })
      .first();
    await expect(failedRow).toBeVisible();
    await failedRow.locator('.vxe-cell--checkbox').click();
    const unlockButton = titledGrid(page, '登录日志列表').getByRole('button', {
      name: antButtonNames.unlock,
    });
    await expect(unlockButton).toBeEnabled();
    const unlockPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/loginInfo/unlock/no_permission',
    );
    const unlockReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/loginInfo/list',
    );
    await unlockButton.click();
    await expectSuccessEnvelope(
      await unlockPromise,
      'unlock failed login user',
    );
    await expectPageEnvelope(
      await unlockReloadPromise,
      'reload unlocked login log',
    );
    await expect(unlockButton).toBeDisabled();

    failedRow = page
      .locator('.vxe-body--row')
      .filter({ hasText: 'no_permission' })
      .filter({ hasText: failedLog.msg })
      .first();
    const deletePromise = waitForApiResponse(
      page,
      'DELETE',
      `/monitor/loginInfo/${failedInfoId}`,
    );
    const deleteReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/loginInfo/list',
    );
    await confirmRowDelete(failedRow, '确认删除?');
    await expectSuccessEnvelope(await deletePromise, 'delete failed login log');
    await expectPageEnvelope(
      await deleteReloadPromise,
      'reload deleted login log',
    );
    await expect(failedRow).toHaveCount(0);
    removed = true;
  } finally {
    await failedContext.close().catch(() => undefined);
    if (apiURL && failedInfoId && !removed) {
      await request.delete(`${apiURL}/monitor/loginInfo/${failedInfoId}`, {
        headers,
      });
    }
  }
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
