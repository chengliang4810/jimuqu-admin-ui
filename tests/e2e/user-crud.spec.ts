import type { APIRequestContext, BrowserContext, Page } from 'playwright/test';

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
  openEditOverlay,
} from './helpers/crud';
import {
  fillLabeledInput,
  formItem,
  selectDepartment,
  selectSafeRole,
} from './helpers/form';
import { openUserManagement } from './helpers/navigation';

interface UserRow {
  nickName: string;
  userId: string;
  userName: string;
}

function tableRow(page: Page, userName: string) {
  return page.locator('.vxe-body--row').filter({ hasText: userName }).first();
}

async function searchUser(page: Page, userName: string) {
  await fillLabeledInput(page, '用户账号', userName);
  const responsePromise = waitForApiResponse(page, 'GET', '/system/user/list');
  const searchForm = formItem(page, '用户账号').locator(
    'xpath=ancestor::form[1]',
  );
  await searchForm.getByRole('button', { name: antButtonNames.search }).click();
  return expectPageEnvelope<UserRow>(await responsePromise, 'search user');
}

async function cleanupUser(
  request: APIRequestContext,
  apiURL: string,
  accessToken: string,
  clientId: string,
  userName: string,
) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: clientId,
  };
  const listResponse = await request.get(`${apiURL}/system/user/list`, {
    headers,
    params: { pageNum: 1, pageSize: 10, userName },
  });
  if (!listResponse.ok()) return;

  const body = (await listResponse.json()) as {
    data?: { rows?: UserRow[] };
  };
  const user = body.data?.rows?.find((item) => item.userName === userName);
  if (user) {
    await request.delete(`${apiURL}/system/user/${user.userId}`, { headers });
  }
}

test('admin creates, searches, edits and deletes a user from the web UI', async ({
  authenticatedSession,
  browser,
  request,
}) => {
  test.setTimeout(180_000);

  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const unique = Date.now().toString(36);
  const userName = `e2e_${unique}`;
  const initialNickName = `E2E用户${unique.slice(-4)}`;
  const updatedNickName = `${initialNickName}已编辑`;
  const resetPassword = `Reset${unique.slice(-6)}!`;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  let created = false;
  let createdUserId: string | undefined;
  let deleted = false;
  let resetContext: BrowserContext | undefined;

  expect(
    apiURL,
    'PLAYWRIGHT_API_URL must be provided by test-fullstack.ps1',
  ).toBeTruthy();

  try {
    await test.step('open user management through the dynamic menu', async () => {
      await openUserManagement(page);
    });

    await test.step('create a user', async () => {
      await page.getByRole('button', { name: antButtonNames.create }).click();
      const dialog = page.getByRole('dialog').last();
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('新增', { exact: true })).toBeVisible();
      await expect(
        dialog.getByRole('button', { name: antButtonNames.confirm }),
      ).toBeEnabled();

      await fillLabeledInput(dialog, '用户账号', userName);
      await fillLabeledInput(dialog, '用户密码', 'Admin123!');
      await fillLabeledInput(dialog, '用户昵称', initialNickName);
      await selectSafeRole(page, dialog);
      await selectDepartment(page, dialog, '研发部');

      const createResponsePromise = waitForApiResponse(
        page,
        'POST',
        '/system/user',
      );
      const reloadResponsePromise = waitForApiResponse(
        page,
        'GET',
        '/system/user/list',
      );
      await dialog
        .getByRole('button', { name: antButtonNames.confirm })
        .click();
      await expectSuccessEnvelope(await createResponsePromise, 'create user');
      created = true;
      await expectPageEnvelope(
        await reloadResponsePromise,
        'reload after create',
      );
      await expect(dialog).toBeHidden();
    });

    await test.step('search for the new user', async () => {
      const envelope = await searchUser(page, userName);
      expect(envelope.data.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ nickName: initialNickName, userName }),
        ]),
      );
      createdUserId = envelope.data.rows.find(
        (row) => row.userName === userName,
      )?.userId;
      expect(createdUserId, 'created user id').toBeTruthy();
      await expect(tableRow(page, userName)).toContainText(initialNickName);
    });

    await test.step('edit the user nickname', async () => {
      const row = tableRow(page, userName);
      const dialog = await openEditOverlay(row);
      await expect(dialog.locator('#userName')).toHaveValue(userName);
      await fillLabeledInput(dialog, '用户昵称', updatedNickName);

      const updateResponsePromise = waitForApiResponse(
        page,
        'PUT',
        '/system/user',
      );
      const reloadResponsePromise = waitForApiResponse(
        page,
        'GET',
        '/system/user/list',
      );
      await dialog
        .getByRole('button', { name: antButtonNames.confirm })
        .click();
      await expectSuccessEnvelope(await updateResponsePromise, 'update user');
      await expectPageEnvelope(
        await reloadResponsePromise,
        'reload after update',
      );
      await expect(dialog).toBeHidden();
      await expect(tableRow(page, userName)).toContainText(updatedNickName);
    });

    await test.step('inspect the user details from the row menu', async () => {
      expect(
        createdUserId,
        'created user id before opening details',
      ).toBeTruthy();
      const row = await actionRow(tableRow(page, userName));
      await row.getByRole('button', { exact: true, name: '更多' }).click();
      const infoItem = page
        .locator('.ant-dropdown-menu-item:visible')
        .filter({ hasText: '用户信息' })
        .last();
      await expect(infoItem).toBeVisible();
      const detailPromise = waitForApiResponse(
        page,
        'GET',
        `/system/user/${createdUserId}`,
      );
      await infoItem.click();
      await expectSuccessEnvelope(await detailPromise, 'load user details');

      const detailDialog = page.getByRole('dialog').last();
      await expect(
        detailDialog.getByText('用户信息', { exact: true }).first(),
      ).toBeVisible();
      await expect(detailDialog).toContainText(userName);
      await expect(detailDialog).toContainText(updatedNickName);
      await detailDialog.locator('.ant-modal-close').click();
      await expect(detailDialog).toBeHidden();
    });

    await test.step('reset the password and log in with it through the real form', async () => {
      const row = await actionRow(tableRow(page, userName));
      await row.getByRole('button', { exact: true, name: '更多' }).click();
      const resetItem = page
        .locator('.ant-dropdown-menu-item:visible')
        .filter({ hasText: '重置密码' })
        .last();
      await expect(resetItem).toBeVisible();
      await resetItem.click();

      const resetDialog = page.getByRole('dialog').last();
      await expect(
        resetDialog.getByText('重置密码', { exact: true }),
      ).toBeVisible();
      await fillLabeledInput(resetDialog, '新的密码', resetPassword);
      const resetPromise = waitForApiResponse(
        page,
        'PUT',
        '/system/user/resetPwd',
      );
      await resetDialog
        .getByRole('button', { name: antButtonNames.confirm })
        .click();
      await expectSuccessEnvelope(await resetPromise, 'reset user password');
      await expect(resetDialog).toBeHidden();

      resetContext = await browser.newContext({
        baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:15555',
      });
      const resetPage = await resetContext.newPage();
      const resetPageIssues: string[] = [];
      resetPage.on('console', (message) => {
        if (message.type() === 'error') {
          resetPageIssues.push(`console.error: ${message.text()}`);
        }
      });
      resetPage.on('pageerror', (error) => {
        resetPageIssues.push(`pageerror: ${error.message}`);
      });
      resetPage.on('requestfailed', (failedRequest) => {
        if (
          ['font', 'image', 'script', 'stylesheet'].includes(
            failedRequest.resourceType(),
          )
        ) {
          resetPageIssues.push(
            `${failedRequest.method()} ${failedRequest.url()} ${failedRequest.failure()?.errorText ?? 'failed'}`,
          );
        }
      });
      resetPage.on('response', (response) => {
        if (
          response.status() >= 500 ||
          (response.status() >= 400 &&
            ['font', 'image', 'script', 'stylesheet'].includes(
              response.request().resourceType(),
            ))
        ) {
          resetPageIssues.push(
            `${response.status()} ${response.request().method()} ${response.url()}`,
          );
        }
      });
      const { envelope } = await loginThroughUi(resetPage, {
        password: resetPassword,
        username: userName,
      });
      await expectSuccessEnvelope(
        await request.post(`${apiURL}/auth/logout`, {
          headers: {
            Authorization: `Bearer ${envelope.data.access_token}`,
            ClientID: envelope.data.client_id,
          },
        }),
        'logout reset-password user',
      );
      expect(resetPageIssues, 'reset-password browser diagnostics').toEqual([]);
      await resetContext.close();
      resetContext = undefined;
    });

    await test.step('delete the user', async () => {
      const row = tableRow(page, userName);
      const deleteResponsePromise = waitForApiResponse(
        page,
        'DELETE',
        /\/system\/user\/[^/]+$/,
      );
      const reloadResponsePromise = waitForApiResponse(
        page,
        'GET',
        '/system/user/list',
      );
      await confirmRowDelete(row, '确认删除？');
      await expectSuccessEnvelope(await deleteResponsePromise, 'delete user');
      deleted = true;
      const envelope = await expectPageEnvelope<UserRow>(
        await reloadResponsePromise,
        'reload after delete',
      );
      expect(envelope.data.rows).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ userName })]),
      );
      await expect(tableRow(page, userName)).toHaveCount(0);
    });
  } finally {
    await resetContext?.close().catch(() => undefined);
    if (created && !deleted && apiURL) {
      await cleanupUser(
        request,
        apiURL,
        accessToken,
        loginEnvelope.data.client_id,
        userName,
      );
    }
  }
});
