import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import {
  actionRow,
  antButtonNames,
  confirmRowDelete,
  dataRow,
  openCreateOverlay,
  openEditOverlay,
  submitOverlay,
} from './helpers/crud';
import { expectExcelExport } from './helpers/download';
import { fillLabeledInput, selectOption } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

test('client CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const clientKey = `e2e_${suffix}`;

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
  const createResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/system/client',
  );
  const createReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/system/client/list',
  );
  await submitOverlay(createOverlay);
  await expectSuccessEnvelope(await createResponsePromise, 'create client');
  await expectPageEnvelope(await createReloadPromise, 'reload created client');

  await fillLabeledInput(page, '客户端key', clientKey);
  const searchResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/system/client/list',
  );
  await page.getByRole('button', { name: antButtonNames.search }).click();
  await expectPageEnvelope(await searchResponsePromise, 'search client');
  await expect(dataRow(page, clientKey)).toBeVisible();

  const editOverlay = await openEditOverlay(dataRow(page, clientKey));
  await fillLabeledInput(editOverlay, 'Token活跃超时时间', '1900');
  const updateResponsePromise = waitForApiResponse(
    page,
    'PUT',
    '/system/client',
  );
  const updateReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/system/client/list',
  );
  await submitOverlay(editOverlay);
  await expectSuccessEnvelope(await updateResponsePromise, 'update client');
  await expectPageEnvelope(await updateReloadPromise, 'reload updated client');
  await expect(dataRow(page, clientKey)).toContainText('1900');

  await expectExcelExport(page, '/system/client/export', 'export clients');

  const deleteResponsePromise = waitForApiResponse(
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
  await expectSuccessEnvelope(await deleteResponsePromise, 'delete client');
  await expectPageEnvelope(await deleteReloadPromise, 'reload deleted client');
  await expect(dataRow(page, clientKey)).toHaveCount(0);
});

test('notice CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const noticeTitle = `E2E公告${suffix}`;
  const updatedTitle = `${noticeTitle}已编辑`;

  await openDynamicModule(page, {
    heading: '通知公告列表',
    item: '通知公告',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/system/notice/list',
    url: /\/system\/notice(?:[/?#]|$)/,
  });

  const createOverlay = await openCreateOverlay(page);
  await fillLabeledInput(createOverlay, '公告标题', noticeTitle);
  const editor = createOverlay.locator('[contenteditable="true"]').first();
  await expect(editor, 'notice editor').toBeVisible();
  await editor.fill(`公告内容 ${suffix}`);
  const createResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/system/notice',
  );
  const createReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/system/notice/list',
  );
  await submitOverlay(createOverlay);
  await expectSuccessEnvelope(await createResponsePromise, 'create notice');
  await expectPageEnvelope(await createReloadPromise, 'reload created notice');

  await fillLabeledInput(page, '公告标题', noticeTitle);
  const searchResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/system/notice/list',
  );
  await page.getByRole('button', { name: antButtonNames.search }).click();
  await expectPageEnvelope(await searchResponsePromise, 'search notice');
  await expect(dataRow(page, noticeTitle)).toBeVisible();

  const noticeRow = await actionRow(dataRow(page, noticeTitle));
  await noticeRow.getByRole('button', { name: '详情', exact: true }).click();
  const previewDialog = page.getByRole('dialog').last();
  await expect(
    previewDialog.getByText('通知公告', { exact: true }).first(),
  ).toBeVisible();
  await expect(previewDialog).toContainText(noticeTitle);
  await expect(previewDialog).toContainText(`公告内容 ${suffix}`);
  await previewDialog.locator('.ant-modal-close').click();
  await expect(previewDialog).toBeHidden();

  const editOverlay = await openEditOverlay(dataRow(page, noticeTitle));
  await fillLabeledInput(editOverlay, '公告标题', updatedTitle);
  const updateResponsePromise = waitForApiResponse(
    page,
    'PUT',
    '/system/notice',
  );
  const updateReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/system/notice/list',
  );
  await submitOverlay(editOverlay);
  await expectSuccessEnvelope(await updateResponsePromise, 'update notice');
  await expectPageEnvelope(await updateReloadPromise, 'reload updated notice');

  await fillLabeledInput(page, '公告标题', updatedTitle);
  const updatedSearchPromise = waitForApiResponse(
    page,
    'GET',
    '/system/notice/list',
  );
  await page.getByRole('button', { name: antButtonNames.search }).click();
  await expectPageEnvelope(await updatedSearchPromise, 'search updated notice');
  await expect(dataRow(page, updatedTitle)).toBeVisible();

  const deleteResponsePromise = waitForApiResponse(
    page,
    'DELETE',
    /\/system\/notice\/[^/]+$/,
  );
  const deleteReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/system/notice/list',
  );
  await confirmRowDelete(dataRow(page, updatedTitle), '确认删除？');
  await expectSuccessEnvelope(await deleteResponsePromise, 'delete notice');
  await expectPageEnvelope(await deleteReloadPromise, 'reload deleted notice');
  await expect(dataRow(page, updatedTitle)).toHaveCount(0);
});
