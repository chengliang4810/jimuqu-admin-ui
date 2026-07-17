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
  openCreateOverlay,
  openEditOverlay,
  submitOverlay,
} from './helpers/crud';
import { fillLabeledInput } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

test('storage configuration CRUD is completed through the web UI without enabling it', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const configKey = `e2e-storage-${suffix}`;

  await openDynamicModule(page, {
    heading: 'oss配置列表',
    item: '存储配置',
    parent: '资源管理',
    responseKind: 'page',
    responsePath: '/resource/oss/config/list',
    url: /\/resource\/oss-config(?:[/?#]|$)/,
  });

  const createOverlay = await openCreateOverlay(page);
  await fillLabeledInput(createOverlay, '配置名称', configKey);
  await fillLabeledInput(createOverlay, '服务地址', '127.0.0.1:9000');
  await fillLabeledInput(createOverlay, 'accessKey', `access_${suffix}`);
  await fillLabeledInput(createOverlay, 'secretKey', `secret_${suffix}`);
  await fillLabeledInput(createOverlay, '桶名称', `bucket-${suffix}`);
  const createResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/resource/oss/config',
  );
  const createReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/config/list',
  );
  await submitOverlay(createOverlay);
  await expectSuccessEnvelope(
    await createResponsePromise,
    'create storage configuration',
  );
  await expectPageEnvelope(
    await createReloadPromise,
    'reload storage configuration',
  );

  await fillLabeledInput(page, '配置名称', configKey);
  const searchResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/config/list',
  );
  await page.getByRole('button', { name: antButtonNames.search }).click();
  await expectPageEnvelope(
    await searchResponsePromise,
    'search storage config',
  );
  await expect(dataRow(page, configKey)).toBeVisible();

  const editOverlay = await openEditOverlay(dataRow(page, configKey));
  await fillLabeledInput(editOverlay, '服务地址', '127.0.0.1:9001');
  const updateResponsePromise = waitForApiResponse(
    page,
    'PUT',
    '/resource/oss/config',
  );
  const updateReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/config/list',
  );
  await submitOverlay(editOverlay);
  await expectSuccessEnvelope(
    await updateResponsePromise,
    'update storage configuration',
  );
  await expectPageEnvelope(
    await updateReloadPromise,
    'reload updated storage configuration',
  );
  await expect(dataRow(page, configKey)).toContainText('127.0.0.1:9001');

  const deleteResponsePromise = waitForApiResponse(
    page,
    'DELETE',
    /\/resource\/oss\/config\/[^/]+$/,
  );
  const deleteReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/config/list',
  );
  await confirmRowDelete(dataRow(page, configKey), '确认删除？');
  await expectSuccessEnvelope(
    await deleteResponsePromise,
    'delete storage configuration',
  );
  await expectPageEnvelope(
    await deleteReloadPromise,
    'reload deleted storage configuration',
  );
  await expect(dataRow(page, configKey)).toHaveCount(0);
});
