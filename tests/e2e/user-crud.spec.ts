import type { APIRequestContext, Page } from 'playwright/test';

import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import {
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
  request,
}) => {
  test.setTimeout(120_000);

  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const unique = Date.now().toString(36);
  const userName = `e2e_${unique}`;
  const initialNickName = `E2E用户${unique.slice(-4)}`;
  const updatedNickName = `${initialNickName}已编辑`;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  let created = false;
  let deleted = false;

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
