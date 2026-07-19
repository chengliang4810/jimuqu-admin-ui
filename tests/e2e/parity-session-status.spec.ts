import type { BrowserContext, Page, Response } from 'playwright/test';

import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import { loginThroughUi } from './helpers/auth';
import {
  actionRow,
  antButtonNames,
  confirmRowDelete,
  dataRow,
  openCreateOverlay,
  submitOverlay,
} from './helpers/crud';
import { fillLabeledInput, formItem, selectOption } from './helpers/form';
import { openDynamicModule, openUserManagement } from './helpers/navigation';

async function searchTable(
  page: Page,
  label: string,
  value: string,
  path: string,
) {
  await fillLabeledInput(page, label, value);
  const responsePromise = waitForApiResponse(page, 'GET', path);
  const form = formItem(page, label).locator('xpath=ancestor::form[1]');
  await form.getByRole('button', { name: antButtonNames.search }).click();
  return expectPageEnvelope<Record<string, unknown>>(
    await responsePromise,
    `search ${value}`,
  );
}

async function toggleStatus(
  page: Page,
  rowText: string,
  mutationPath: string,
  listPath: string,
) {
  const row = dataRow(page, rowText);
  const statusSwitch = row.locator('.ant-switch').first();
  await expect(statusSwitch, `${rowText} status switch`).toBeVisible();
  const before = await statusSwitch.getAttribute('aria-checked');
  const mutationPromise = waitForApiResponse(page, 'PUT', mutationPath);
  const reloadPromise = waitForApiResponse(page, 'GET', listPath);
  await statusSwitch.click();
  await expectSuccessEnvelope(
    await mutationPromise,
    `toggle ${rowText} status`,
  );
  await expectPageEnvelope(await reloadPromise, `reload ${rowText} status`);
  return before;
}

test('user, role and client status changes persist after a browser reload', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(180_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  let clientId: string | undefined;
  let roleId: string | undefined;
  let userId: string | undefined;
  let userOriginalStatus: string | undefined;
  const suffix = Date.now().toString(36);
  const clientKey = `status_${suffix}`;
  const roleName = `E2E状态角色${suffix}`;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await openUserManagement(page);
    const users = await searchTable(
      page,
      '用户账号',
      'custom_user',
      '/system/user/list',
    );
    const customUser = users.data.rows.find(
      (row) => row.userName === 'custom_user',
    );
    expect(customUser, 'custom_user seed').toBeTruthy();
    userId = String(customUser?.userId ?? '');
    userOriginalStatus = String(customUser?.status ?? '');
    const userStatus = await toggleStatus(
      page,
      'custom_user',
      '/system/user/changeStatus',
      '/system/user/list',
    );
    const userReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/user/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPageEnvelope(await userReloadPromise, 'reload user module');
    await searchTable(page, '用户账号', 'custom_user', '/system/user/list');
    await expect(
      dataRow(page, 'custom_user').locator('.ant-switch').first(),
    ).toHaveAttribute('aria-checked', userStatus === 'true' ? 'false' : 'true');
    await toggleStatus(
      page,
      'custom_user',
      '/system/user/changeStatus',
      '/system/user/list',
    );

    await openDynamicModule(page, {
      heading: '角色列表',
      item: '角色管理',
      parent: '系统管理',
      responseKind: 'page',
      responsePath: '/system/role/list',
      url: /\/system\/role(?:[/?#]|$)/,
    });
    const createRoleOverlay = await openCreateOverlay(page);
    await fillLabeledInput(createRoleOverlay, '角色名称', roleName);
    await fillLabeledInput(
      createRoleOverlay,
      '权限标识',
      `status_role_${suffix}`,
    );
    const createRolePromise = waitForApiResponse(page, 'POST', '/system/role');
    const createRoleReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/list',
    );
    await submitOverlay(createRoleOverlay);
    await expectSuccessEnvelope(await createRolePromise, 'create status role');
    await expectPageEnvelope(
      await createRoleReloadPromise,
      'reload created status role',
    );

    const roles = await searchTable(
      page,
      '角色名称',
      roleName,
      '/system/role/list',
    );
    const statusRole = roles.data.rows.find((row) => row.roleName === roleName);
    expect(statusRole, 'unassigned status role').toBeTruthy();
    roleId = String(statusRole?.roleId ?? '');
    const roleStatus = await toggleStatus(
      page,
      roleName,
      '/system/role/changeStatus',
      '/system/role/list',
    );
    const roleReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPageEnvelope(await roleReloadPromise, 'reload role module');
    await searchTable(page, '角色名称', roleName, '/system/role/list');
    await expect(
      dataRow(page, roleName).locator('.ant-switch').first(),
    ).toHaveAttribute('aria-checked', roleStatus === 'true' ? 'false' : 'true');
    await toggleStatus(
      page,
      roleName,
      '/system/role/changeStatus',
      '/system/role/list',
    );
    const deleteRolePromise = waitForApiResponse(
      page,
      'DELETE',
      /\/system\/role\/[^/]+$/,
    );
    const deleteRoleReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/list',
    );
    await confirmRowDelete(dataRow(page, roleName), '确认删除？');
    await expectSuccessEnvelope(await deleteRolePromise, 'delete status role');
    roleId = undefined;
    await expectPageEnvelope(
      await deleteRoleReloadPromise,
      'reload deleted status role',
    );

    await openDynamicModule(page, {
      heading: '客户端列表',
      item: '客户端管理',
      parent: '系统管理',
      responseKind: 'page',
      responsePath: '/system/client/list',
      url: /\/system\/client(?:[/?#]|$)/,
    });
    const createOverlay = await openCreateOverlay(page);
    await fillLabeledInput(createOverlay, '客户端key', clientKey);
    await fillLabeledInput(createOverlay, '客户端密钥', `secret_${suffix}`);
    await selectOption(page, createOverlay, '授权类型', '密码', true);
    await selectOption(page, createOverlay, '设备类型', 'PC');
    const createPromise = waitForApiResponse(page, 'POST', '/system/client');
    const createReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/client/list',
    );
    await submitOverlay(createOverlay);
    await expectSuccessEnvelope(await createPromise, 'create status client');
    await expectPageEnvelope(await createReloadPromise, 'reload status client');

    const clients = await searchTable(
      page,
      '客户端key',
      clientKey,
      '/system/client/list',
    );
    const createdClient = clients.data.rows.find(
      (row) => row.clientKey === clientKey,
    );
    expect(createdClient, 'created status client').toBeTruthy();
    clientId = String(createdClient?.id ?? '');
    const clientStatus = await toggleStatus(
      page,
      clientKey,
      '/system/client/changeStatus',
      '/system/client/list',
    );
    const clientReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/client/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPageEnvelope(await clientReloadPromise, 'reload client module');
    await searchTable(page, '客户端key', clientKey, '/system/client/list');
    await expect(
      dataRow(page, clientKey).locator('.ant-switch').first(),
    ).toHaveAttribute(
      'aria-checked',
      clientStatus === 'true' ? 'false' : 'true',
    );
    await toggleStatus(
      page,
      clientKey,
      '/system/client/changeStatus',
      '/system/client/list',
    );

    const deletePromise = waitForApiResponse(
      page,
      'DELETE',
      /\/system\/client\/[^/]+$/,
    );
    const deleteReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/client/list',
    );
    await confirmRowDelete(dataRow(page, clientKey), '确认删除？');
    await expectSuccessEnvelope(await deletePromise, 'delete status client');
    clientId = undefined;
    await expectPageEnvelope(
      await deleteReloadPromise,
      'reload deleted status client',
    );
  } finally {
    if (apiURL && userId && userOriginalStatus) {
      await expectSuccessEnvelope(
        await request.put(`${apiURL}/system/user/changeStatus`, {
          data: { status: userOriginalStatus, userId },
          headers,
        }),
        'restore user status during cleanup',
      );
    }
    if (apiURL && !roleId) {
      const response = await request.get(`${apiURL}/system/role/list`, {
        headers,
        params: { pageNum: 1, pageSize: 10, roleName },
      });
      const envelope = await expectPageEnvelope<{
        roleId: string;
        roleName: string;
      }>(response, 'find status role during cleanup');
      roleId = envelope.data.rows.find(
        (row) => row.roleName === roleName,
      )?.roleId;
    }
    if (apiURL && roleId) {
      await expectSuccessEnvelope(
        await request.delete(`${apiURL}/system/role/${roleId}`, { headers }),
        'delete status role during cleanup',
      );
    }
    if (apiURL && !clientId) {
      const response = await request.get(`${apiURL}/system/client/list`, {
        headers,
        params: { clientKey, pageNum: 1, pageSize: 10 },
      });
      const envelope = await expectPageEnvelope<{
        clientKey: string;
        id: string;
      }>(response, 'find status client during cleanup');
      clientId = envelope.data.rows.find(
        (row) => row.clientKey === clientKey,
      )?.id;
    }
    if (apiURL && clientId) {
      await expectSuccessEnvelope(
        await request.delete(`${apiURL}/system/client/${clientId}`, {
          headers,
        }),
        'delete status client during cleanup',
      );
    }
  }
});

function recordBrowserIssues(page: Page) {
  const issues: string[] = [];
  const resourceTypes = new Set(['font', 'image', 'script', 'stylesheet']);
  page.on('console', (message) => {
    if (message.type() === 'error')
      issues.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (resourceTypes.has(request.resourceType())) {
      issues.push(
        `${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'failed'}`,
      );
    }
  });
  page.on('response', (response: Response) => {
    if (response.status() >= 500) {
      issues.push(
        `${response.status()} ${response.request().method()} ${response.url()}`,
      );
    } else if (
      response.status() >= 400 &&
      resourceTypes.has(response.request().resourceType())
    ) {
      issues.push(
        `${response.status()} ${response.request().resourceType()} ${response.url()}`,
      );
    }
  });
  return issues;
}

function formatDateTime(value: number) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

test('an administrator forces a different browser session offline from the web UI', async ({
  authenticatedSession,
  browser,
  request,
}) => {
  test.setTimeout(120_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  let secondContext: BrowserContext | undefined;
  let secondIssues: string[] = [];
  let secondToken: string | undefined;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await page.waitForTimeout(1100);
    secondContext = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:15555',
    });
    const secondPage = await secondContext.newPage();
    secondIssues = recordBrowserIssues(secondPage);
    const secondLogin = await loginThroughUi(secondPage);
    secondToken = secondLogin.envelope.data.access_token;

    await openDynamicModule(page, {
      heading: '在线用户列表',
      item: '在线用户',
      parent: '系统监控',
      responseKind: 'page',
      responsePath: '/monitor/online/list',
      url: /\/monitor\/online(?:[/?#]|$)/,
    });

    const refreshPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/online/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    const envelope = await expectPageEnvelope<{
      loginTime: number;
      tokenId: string;
      userName: string;
    }>(await refreshPromise, 'refresh online sessions');
    const target = envelope.data.rows.find(
      (row) => row.tokenId === secondLogin.envelope.data.access_token,
    );
    expect(
      target,
      'second UI login must appear in online sessions',
    ).toBeTruthy();
    if (!target) {
      throw new Error('second UI login is missing from online sessions');
    }

    const row = page
      .locator('.vxe-body--row')
      .filter({ hasText: formatDateTime(target.loginTime) })
      .first();
    await expect(row, 'second browser online row').toBeVisible();
    const fixedRow = await actionRow(row);
    const forcePromise = waitForApiResponse(
      page,
      'DELETE',
      `/monitor/online/${target.tokenId}`,
    );
    const listPromise = waitForApiResponse(page, 'GET', '/monitor/online/list');
    await fixedRow.getByRole('button', { name: '强制下线' }).click();
    const popconfirm = page.locator('.ant-popover:visible').last();
    await popconfirm
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(
      await forcePromise,
      'force second session offline',
    );
    const reloaded = await expectPageEnvelope<{
      tokenId: string;
    }>(await listPromise, 'reload forced session');
    expect(reloaded.data.rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tokenId: target.tokenId }),
      ]),
    );
    secondToken = undefined;

    await secondPage.reload({ waitUntil: 'domcontentloaded' });
    await expect(secondPage).toHaveURL(/\/auth\/login(?:[/?#]|$)/, {
      timeout: 30_000,
    });
    const expectedForcedLogoutIssue = (issue: string) =>
      issue ===
        'console.error: Failed to load resource: the server responded with a status of 401 (Unauthorized)' ||
      (issue.startsWith('console.error: ') &&
        issue.includes('登录认证过期，请重新登录后继续。'));
    expect(
      secondIssues.some((issue) => issue.includes('401 (Unauthorized)')),
      'forced session must receive an unauthorized response',
    ).toBe(true);
    expect(
      secondIssues.some((issue) => issue.includes('登录认证过期')),
      'forced session must execute Bell expired-login handling',
    ).toBe(true);
    expect(
      secondIssues.filter((issue) => !expectedForcedLogoutIssue(issue)),
      'second browser must have no unexpected diagnostics',
    ).toEqual([]);
  } finally {
    await secondContext?.close();
    if (apiURL && secondToken) {
      await expectSuccessEnvelope(
        await request.delete(`${apiURL}/monitor/online/${secondToken}`, {
          headers,
        }),
        'force second session offline during cleanup',
      );
    }
  }
});
