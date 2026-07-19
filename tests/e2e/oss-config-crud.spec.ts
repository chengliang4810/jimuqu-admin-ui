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
  openCreateOverlay,
  openEditOverlay,
  submitOverlay,
} from './helpers/crud';
import { fillLabeledInput, formItem } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

interface StorageConfigRow {
  configKey: string;
  ossConfigId: string;
  status: string;
}

async function openStorageConfig(page: Page) {
  await openDynamicModule(page, {
    heading: '文件列表',
    item: '文件管理',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/resource/oss/list',
    url: /\/system\/oss(?:[/?#]|$)/,
  });
  const listPromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/config/list',
  );
  await page.getByRole('button', { name: '配置管理' }).click();
  const list = await expectPageEnvelope<StorageConfigRow>(
    await listPromise,
    'open hidden storage configuration route',
  );
  await expect(page).toHaveURL(/\/system\/oss-config\/index(?:[/?#]|$)/);
  await expect(
    page.getByText('oss配置列表', { exact: false }).first(),
  ).toBeVisible();
  return list;
}

async function searchStorageConfig(page: Page, configKey: string) {
  await fillLabeledInput(page, '配置名称', configKey);
  const responsePromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/config/list',
  );
  const form = formItem(page, '配置名称').locator('xpath=ancestor::form[1]');
  await form.getByRole('button', { name: antButtonNames.search }).click();
  return expectPageEnvelope<StorageConfigRow>(
    await responsePromise,
    `search storage config ${configKey}`,
  );
}

test('storage configuration CRUD is completed through the web UI without enabling it', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const configKey = `e2e-storage-${suffix}`;

  await openStorageConfig(page);

  await page.getByRole('button', { name: '导入配置' }).click();
  const importDialog = page.getByRole('dialog').filter({
    has: page.getByText('导入配置', { exact: true }),
  });
  await expect(
    importDialog.getByText('导入配置', { exact: true }),
  ).toBeVisible();
  await importDialog.locator('textarea').fill(
    JSON.stringify({
      accessKey: `import_access_${suffix}`,
      bucketName: `import-bucket-${suffix}`,
      configKey: `import-${configKey}`,
      domain: '',
      endpoint: '127.0.0.1:9100',
      isHttps: 'N',
      prefix: '',
      secretKey: `import_secret_${suffix}`,
      status: 'N',
    }),
  );
  await submitOverlay(importDialog);
  await expect(importDialog).toBeHidden();
  const importedDrawer = page.getByRole('dialog').last();
  await expect(
    formItem(importedDrawer, '配置名称').locator('input'),
  ).toHaveValue(`import-${configKey}`);
  await expect(
    formItem(importedDrawer, '服务地址').locator('input'),
  ).toHaveValue('127.0.0.1:9100');
  await importedDrawer
    .getByRole('button', { name: antButtonNames.cancel })
    .click();
  await expect(importedDrawer).toBeHidden();

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

test('default storage configuration status persists after browser reload', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(120_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  let defaultConfig: StorageConfigRow | undefined;
  let restored = false;

  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await openStorageConfig(page);
    const configs = await searchStorageConfig(page, 'default');
    defaultConfig = configs.data.rows.find(
      (row) => row.configKey === 'default',
    );
    expect(defaultConfig, 'default storage configuration').toBeTruthy();
    if (!defaultConfig)
      throw new Error('default storage configuration is missing');

    let statusSwitch = dataRow(page, 'default').locator('.ant-switch').first();
    await expect(statusSwitch).toHaveAttribute('aria-checked', 'true');
    const disablePromise = waitForApiResponse(
      page,
      'PUT',
      '/resource/oss/config/changeStatus',
    );
    const disableReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/resource/oss/config/list',
    );
    await statusSwitch.click();
    await expectSuccessEnvelope(
      await disablePromise,
      'disable default storage configuration',
    );
    await expectPageEnvelope(
      await disableReloadPromise,
      'reload disabled storage configuration',
    );

    const disabledPageReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/resource/oss/config/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPageEnvelope(
      await disabledPageReloadPromise,
      'reload storage configuration page',
    );
    await searchStorageConfig(page, 'default');
    statusSwitch = dataRow(page, 'default').locator('.ant-switch').first();
    await expect(statusSwitch).toHaveAttribute('aria-checked', 'false');

    const enablePromise = waitForApiResponse(
      page,
      'PUT',
      '/resource/oss/config/changeStatus',
    );
    const enableReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/resource/oss/config/list',
    );
    await statusSwitch.click();
    await expectSuccessEnvelope(
      await enablePromise,
      'restore default storage configuration',
    );
    await expectPageEnvelope(
      await enableReloadPromise,
      'reload restored storage configuration',
    );

    const restoredPageReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/resource/oss/config/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPageEnvelope(
      await restoredPageReloadPromise,
      'reload restored storage page',
    );
    await searchStorageConfig(page, 'default');
    await expect(
      dataRow(page, 'default').locator('.ant-switch').first(),
    ).toHaveAttribute('aria-checked', 'true');
    restored = true;
  } finally {
    if (apiURL && defaultConfig && !restored) {
      await expectSuccessEnvelope(
        await request.put(`${apiURL}/resource/oss/config/changeStatus`, {
          data: {
            configKey: defaultConfig.configKey,
            ossConfigId: defaultConfig.ossConfigId,
            status: defaultConfig.status,
          },
          headers,
        }),
        'restore default storage configuration during cleanup',
      );
    }
  }
});
