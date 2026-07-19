import { Buffer } from 'node:buffer';

import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import { antButtonNames, confirmRowDelete, dataRow } from './helpers/crud';
import { fillLabeledInput } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

test('a file is uploaded, found and deleted entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const originalName = `e2e-upload-${suffix}.txt`;

  await openDynamicModule(page, {
    heading: '文件列表',
    item: '文件管理',
    parent: '系统管理',
    responseKind: 'page',
    responsePath: '/resource/oss/list',
    url: /\/system\/oss(?:[/?#]|$)/,
  });

  await page.getByRole('button', { exact: true, name: '文件上传' }).click();
  const uploadModal = page.getByRole('dialog').last();
  await expect(
    uploadModal.getByText('文件上传', { exact: true }),
  ).toBeVisible();

  const uploadResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/resource/oss/upload',
  );
  await uploadModal.locator('input[type="file"]').setInputFiles({
    buffer: Buffer.from(`jimuqu e2e ${suffix}`, 'utf8'),
    mimeType: 'text/plain',
    name: originalName,
  });
  const uploadEnvelope = await expectSuccessEnvelope<{
    fileName: string;
    ossId: string;
    url: string;
  }>(await uploadResponsePromise, 'upload OSS file');
  expect(uploadEnvelope.data.ossId).toBeTruthy();
  await expect(
    uploadModal.getByRole('link', { name: originalName, exact: true }),
  ).toBeVisible();

  const closeReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/list',
  );
  await uploadModal.locator('.ant-modal-close').click();
  await expectPageEnvelope(
    await closeReloadPromise,
    'reload uploaded OSS file',
  );
  await expect(uploadModal).toBeHidden();

  await fillLabeledInput(page, '原名', originalName);
  const searchResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/list',
  );
  await page.getByRole('button', { name: antButtonNames.search }).click();
  const searchEnvelope = await expectPageEnvelope<{
    originalName: string;
    ossId: string;
  }>(await searchResponsePromise, 'search uploaded OSS file');
  expect(searchEnvelope.data.rows).toEqual(
    expect.arrayContaining([expect.objectContaining({ originalName })]),
  );
  await expect(dataRow(page, originalName)).toBeVisible();

  const deleteResponsePromise = waitForApiResponse(
    page,
    'DELETE',
    /\/resource\/oss\/[^/]+$/,
  );
  const deleteReloadPromise = waitForApiResponse(
    page,
    'GET',
    '/resource/oss/list',
  );
  await confirmRowDelete(dataRow(page, originalName), '确认删除？');
  await expectSuccessEnvelope(await deleteResponsePromise, 'delete OSS file');
  await expectPageEnvelope(
    await deleteReloadPromise,
    'reload deleted OSS file',
  );
  await expect(dataRow(page, originalName)).toHaveCount(0);
});
