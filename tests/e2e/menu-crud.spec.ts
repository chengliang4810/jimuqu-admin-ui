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
import { fillLabeledInput } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

test('menu CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const menuName = `E2E菜单${suffix}`;
  const updatedName = `${menuName}已编辑`;

  await openDynamicModule(page, {
    heading: '菜单列表',
    item: '菜单管理',
    parent: '系统管理',
    responseKind: 'list',
    responsePath: '/system/menu/list',
    url: /\/system\/menu(?:[/?#]|$)/,
  });

  const createOverlay = await openCreateOverlay(page);
  await fillLabeledInput(createOverlay, '菜单名称', menuName);
  await fillLabeledInput(createOverlay, '路由地址', `e2e-${suffix}`);
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
  await fillLabeledInput(editOverlay, '菜单名称', updatedName);
  const updateResponsePromise = waitForApiResponse(page, 'PUT', '/system/menu');
  const updateReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/system/menu/list',
  );
  await submitOverlay(editOverlay);
  await expectSuccessEnvelope(await updateResponsePromise, 'update menu');
  await expectSuccessEnvelope(await updateReloadPromise, 'reload updated menu');

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
  await expectSuccessEnvelope(await deleteReloadPromise, 'reload deleted menu');
  await expect(dataRow(page, updatedName)).toHaveCount(0);
});
