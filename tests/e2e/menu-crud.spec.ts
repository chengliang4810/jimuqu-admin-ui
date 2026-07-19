import type { APIRequestContext } from 'playwright/test';

import { expect, test } from './fixtures';
import { expectSuccessEnvelope, waitForApiResponse } from './helpers/api';
import {
  antButtonNames,
  confirmRowDelete,
  dataRow,
  openCreateOverlay,
  openEditOverlay,
  submitOverlay,
} from './helpers/crud';
import { fillLabeledInput, formItem } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

interface MenuRow {
  menuId: string;
  menuName: string;
}

async function cleanupMenu(
  request: APIRequestContext,
  apiURL: string,
  headers: Record<string, string>,
  menuName: string,
) {
  const response = await request.get(`${apiURL}/system/menu/list`, {
    headers,
    params: { menuName },
  });
  if (!response.ok()) return;
  const body = (await response.json()) as {
    code?: number;
    data?: MenuRow[];
  };
  if (body.code !== 200) return;
  const menu = body.data?.find(
    (item) =>
      item.menuName === menuName || item.menuName === `${menuName}已编辑`,
  );
  if (menu) {
    await request.delete(`${apiURL}/system/menu/${menu.menuId}`, { headers });
  }
}

test('menu CRUD is completed entirely through the web UI', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(120_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const suffix = Date.now().toString(36);
  const menuName = `E2E菜单${suffix}`;
  const updatedName = `${menuName}已编辑`;
  const externalURL = `https://example.com/e2e-${suffix}`;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  let cleaned = false;

  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await openDynamicModule(page, {
      heading: '菜单列表',
      item: '菜单管理',
      parent: '系统管理',
      responseKind: 'list',
      responsePath: '/system/menu/list',
      url: /\/system\/menu(?:[/?#]|$)/,
    });

    await page.getByRole('button', { name: '导入配置' }).click();
    const importDialog = page.getByRole('dialog').filter({
      has: page.getByText('导入配置', { exact: true }),
    });
    await expect(
      importDialog.getByText('导入配置', { exact: true }),
    ).toBeVisible();
    await importDialog.locator('textarea').fill(
      JSON.stringify({
        component: 'system/user/index',
        isCache: 'Y',
        isFrame: 'N',
        menuName: `${menuName}导入预览`,
        menuType: 'C',
        orderNum: 99,
        parentId: '1',
        path: `import-preview-${suffix}`,
        status: '0',
        visible: '0',
      }),
    );
    await submitOverlay(importDialog);
    await expect(importDialog).toBeHidden();
    const importedDrawer = page.getByRole('dialog').last();
    await expect(
      importedDrawer.getByText('新增', { exact: true }),
    ).toBeVisible();
    await expect(
      formItem(importedDrawer, '菜单名称').locator('input'),
    ).toHaveValue(`${menuName}导入预览`);
    await expect(
      formItem(importedDrawer, '路由地址').locator('input'),
    ).toHaveValue(`import-preview-${suffix}`);
    await importedDrawer
      .getByRole('button', { name: antButtonNames.cancel })
      .click();
    await expect(importedDrawer).toBeHidden();

    const createOverlay = await openCreateOverlay(page);
    await formItem(createOverlay, '菜单类型')
      .getByText('菜单', { exact: true })
      .click();
    await formItem(createOverlay, '是否外链')
      .getByText('是', { exact: true })
      .click();
    const pathInput = formItem(createOverlay, '路由地址').locator('input');
    await expect(pathInput).toHaveAttribute('placeholder', /填写链接地址/);
    await expect(
      formItem(createOverlay, '组件路径').locator('input'),
    ).toBeDisabled();
    await fillLabeledInput(createOverlay, '菜单名称', menuName);
    await fillLabeledInput(createOverlay, '路由地址', externalURL);
    const createResponsePromise = waitForApiResponse(
      page,
      'POST',
      '/system/menu',
    );
    const createReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/list',
    );
    await submitOverlay(createOverlay);
    await expectSuccessEnvelope(await createResponsePromise, 'create menu');
    expect(
      Array.isArray(
        (await expectSuccessEnvelope(await createReloadPromise, 'reload menu'))
          .data,
      ),
    ).toBe(true);

    await fillLabeledInput(page, '菜单名称', menuName);
    const searchResponsePromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/list',
    );
    await page.getByRole('button', { name: antButtonNames.search }).click();
    await expectSuccessEnvelope(await searchResponsePromise, 'search menu');
    await expect(dataRow(page, menuName)).toBeVisible();

    const editOverlay = await openEditOverlay(dataRow(page, menuName));
    await expect(
      formItem(editOverlay, '路由地址').locator('input'),
    ).toHaveValue(externalURL);
    await expect(
      formItem(editOverlay, '是否外链').getByRole('radio', { name: '是' }),
    ).toBeChecked();
    await expect(
      formItem(editOverlay, '组件路径').locator('input'),
    ).toBeDisabled();
    await fillLabeledInput(editOverlay, '菜单名称', updatedName);
    const updateResponsePromise = waitForApiResponse(
      page,
      'PUT',
      '/system/menu',
    );
    const updateReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/list',
    );
    await submitOverlay(editOverlay);
    await expectSuccessEnvelope(await updateResponsePromise, 'update menu');
    await expectSuccessEnvelope(
      await updateReloadPromise,
      'reload updated menu',
    );

    const pageReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectSuccessEnvelope(await pageReloadPromise, 'reload menu page');
    await fillLabeledInput(page, '菜单名称', updatedName);
    const updatedSearchPromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/list',
    );
    await page.getByRole('button', { name: antButtonNames.search }).click();
    await expectSuccessEnvelope(
      await updatedSearchPromise,
      'search updated menu',
    );
    await expect(dataRow(page, updatedName)).toBeVisible();

    const persistedOverlay = await openEditOverlay(dataRow(page, updatedName));
    await expect(
      formItem(persistedOverlay, '路由地址').locator('input'),
    ).toHaveValue(externalURL);
    await expect(
      formItem(persistedOverlay, '是否外链').getByRole('radio', { name: '是' }),
    ).toBeChecked();
    await persistedOverlay
      .getByRole('button', { name: antButtonNames.cancel })
      .click();
    await expect(persistedOverlay).toBeHidden();

    const deleteResponsePromise = waitForApiResponse(
      page,
      'DELETE',
      /\/system\/menu\/[^/]+$/,
    );
    const deleteReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/list',
    );
    await confirmRowDelete(dataRow(page, updatedName), updatedName);
    await expectSuccessEnvelope(await deleteResponsePromise, 'delete menu');
    await expectSuccessEnvelope(
      await deleteReloadPromise,
      'reload deleted menu',
    );
    await expect(dataRow(page, updatedName)).toHaveCount(0);
    cleaned = true;
  } finally {
    if (!cleaned && apiURL) {
      await cleanupMenu(request, apiURL, headers, menuName);
    }
  }
});
