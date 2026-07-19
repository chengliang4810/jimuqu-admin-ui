import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { Window } from 'happy-dom';

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
} from './helpers/crud';
import { fillLabeledInput } from './helpers/form';
import { openDynamicModule, openUserManagement } from './helpers/navigation';

function toUserImportWorkbook(exportWorkbook: Buffer) {
  const files = unzipSync(exportWorkbook);
  const worksheetPath = 'xl/worksheets/sheet1.xml';
  const worksheet = files[worksheetPath];
  if (!worksheet) {
    throw new Error(`exported user workbook is missing ${worksheetPath}`);
  }

  const window = new Window();
  const document = new window.DOMParser().parseFromString(
    strFromU8(worksheet),
    'application/xml',
  );
  let columnBCount = 0;
  let columnCCount = 0;
  for (const row of document.getElementsByTagName('row')) {
    let columnBCell: Element | undefined;
    let columnCCell: Element | undefined;
    for (const cell of row.getElementsByTagName('c')) {
      const reference = cell.getAttribute('r');
      const match = reference?.match(/^([BC])(\d+)$/);
      if (!match) continue;

      const [, column, rowNumber] = match;
      cell.setAttribute('r', `${column === 'B' ? 'C' : 'B'}${rowNumber}`);
      if (column === 'B') {
        columnBCount++;
        columnCCell = cell;
      } else {
        columnCCount++;
        columnBCell = cell;
      }
    }
    if (columnBCell && columnCCell) {
      row.insertBefore(columnBCell, columnCCell);
    }
  }
  if (columnBCount === 0 || columnBCount !== columnCCount) {
    throw new Error(
      `cannot swap exported user columns B/C: B=${columnBCount}, C=${columnCCount}`,
    );
  }

  files[worksheetPath] = strToU8(
    new window.XMLSerializer().serializeToString(document),
  );
  return Buffer.from(zipSync(files));
}

test('user export, template download and import run through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const importedUserName = 'custom_user';

  await openUserManagement(page);

  await fillLabeledInput(page, '用户账号', importedUserName);
  const filteredUsersPromise = waitForApiResponse(
    page,
    'GET',
    '/system/user/list',
  );
  await page.getByRole('button', { name: antButtonNames.search }).click();
  const filteredUsers = await expectPageEnvelope<{ userName: string }>(
    await filteredUsersPromise,
    'filter user before export',
  );
  expect(filteredUsers.data.rows).toEqual([
    expect.objectContaining({ userName: importedUserName }),
  ]);

  const exportResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/system/user/export',
  );
  const exportDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^导\s*出$/ }).click();
  const [exportResponse, exportDownload] = await Promise.all([
    exportResponsePromise,
    exportDownloadPromise,
  ]);
  expect(exportResponse.ok(), 'export users response').toBe(true);
  expect(exportDownload.suggestedFilename()).toMatch(/\.xlsx$/i);
  const exportPath = await exportDownload.path();
  expect(exportPath, 'exported user workbook path').toBeTruthy();
  if (!exportPath) {
    throw new Error('exported user workbook path is missing');
  }
  const exportBuffer = await readFile(exportPath);
  expect(exportBuffer.byteLength).toBeGreaterThan(0);
  const importBuffer = toUserImportWorkbook(exportBuffer);
  expect(importBuffer.byteLength).toBeGreaterThan(0);

  await page.getByRole('button', { name: /^导\s*入$/ }).click();
  const importDialog = page.getByRole('dialog', {
    exact: true,
    name: '用户导入',
  });
  await expect(
    importDialog.getByText('用户导入', { exact: true }),
  ).toBeVisible();

  const templateResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/system/user/importTemplate',
  );
  const templateDownloadPromise = page.waitForEvent('download');
  await importDialog.getByRole('button', { name: '下载模板' }).click();
  const [templateResponse, templateDownload] = await Promise.all([
    templateResponsePromise,
    templateDownloadPromise,
  ]);
  expect(templateResponse.ok(), 'download import template response').toBe(true);
  expect(templateDownload.suggestedFilename()).toBe('用户导入模板.xlsx');
  const templatePath = await templateDownload.path();
  expect(templatePath, 'downloaded import template path').toBeTruthy();
  if (!templatePath) {
    throw new Error('downloaded import template path is missing');
  }
  const templateBuffer = await readFile(templatePath);
  expect(templateBuffer.byteLength).toBeGreaterThan(0);

  await importDialog.locator('input[type="file"]').setInputFiles({
    buffer: importBuffer,
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    name: exportDownload.suggestedFilename(),
  });
  await expect(
    importDialog.getByText(exportDownload.suggestedFilename()),
  ).toBeVisible();
  const updateExistingSwitch = importDialog.getByRole('switch');
  await updateExistingSwitch.click();
  await expect(updateExistingSwitch).toBeChecked();

  const importResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/system/user/importData',
  );
  const reloadResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/system/user/list',
  );
  await importDialog
    .getByRole('button', { name: antButtonNames.confirm })
    .click();
  const importEnvelope = await expectSuccessEnvelope(
    await importResponsePromise,
    'import users',
  );
  expect(importEnvelope.msg).toBe(
    `恭喜您，数据已全部导入成功！共 1 条，数据如下：<br/>1、账号 ${importedUserName} 更新成功`,
  );
  const reloadedUsers = await expectPageEnvelope<{ userName: string }>(
    await reloadResponsePromise,
    'reload imported users',
  );
  expect(reloadedUsers.data.rows).toEqual([
    expect.objectContaining({ userName: importedUserName }),
  ]);
  await expect(importDialog).toBeHidden();

  const resultDialog = page.getByRole('dialog', {
    exact: true,
    name: '提示',
  });
  await expect(resultDialog).toContainText(
    '恭喜您，数据已全部导入成功！共 1 条，数据如下：',
  );
  await expect(resultDialog).toContainText(
    `1、账号 ${importedUserName} 更新成功`,
  );
  await resultDialog.getByRole('button', { name: '知道了' }).click();
  await expect(resultDialog).toBeHidden();
  await expect(dataRow(page, importedUserName)).toBeVisible();

  const refreshedUserInfoPromise = waitForApiResponse(
    page,
    'GET',
    '/system/user/getInfo',
  );
  const refreshedRoutersPromise = waitForApiResponse(
    page,
    'GET',
    '/system/menu/getRouters',
  );
  const persistedUsersPromise = waitForApiResponse(
    page,
    'GET',
    '/system/user/list',
  );
  await page.reload();
  await expectSuccessEnvelope(
    await refreshedUserInfoPromise,
    'refreshed user info',
  );
  await expectSuccessEnvelope(
    await refreshedRoutersPromise,
    'refreshed routers',
  );
  const persistedUsers = await expectPageEnvelope<{ userName: string }>(
    await persistedUsersPromise,
    'users after browser refresh',
  );
  expect(persistedUsers.data.rows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ userName: importedUserName }),
    ]),
  );
  await expect(dataRow(page, importedUserName)).toBeVisible();
});

test('an uploaded OSS file is downloaded with its original bytes from the web UI', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(120_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const suffix = Date.now().toString(36);
  const originalName = `e2e-download-${suffix}.txt`;
  const content = Buffer.from(`jimuqu download parity ${suffix}`, 'utf8');
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  let uploadedOssId: string | undefined;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await openDynamicModule(page, {
      heading: '文件列表',
      item: '文件管理',
      parent: '系统管理',
      responseKind: 'page',
      responsePath: '/resource/oss/list',
      url: /\/system\/oss(?:[/?#]|$)/,
    });

    await page.getByRole('button', { exact: true, name: '文件上传' }).click();
    const uploadDialog = page.getByRole('dialog').last();
    await expect(
      uploadDialog.getByText('文件上传', { exact: true }),
    ).toBeVisible();

    const uploadResponsePromise = waitForApiResponse(
      page,
      'POST',
      '/resource/oss/upload',
    );
    await uploadDialog.locator('input[type="file"]').setInputFiles({
      buffer: content,
      mimeType: 'text/plain',
      name: originalName,
    });
    const uploadEnvelope = await expectSuccessEnvelope<{
      fileName: string;
      ossId: string;
      url: string;
    }>(await uploadResponsePromise, 'upload downloadable OSS file');
    uploadedOssId = uploadEnvelope.data.ossId;
    expect(uploadedOssId).toBeTruthy();

    const closeReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/resource/oss/list',
    );
    await uploadDialog.locator('.ant-modal-close').click();
    await expectPageEnvelope(
      await closeReloadPromise,
      'reload uploaded OSS file',
    );

    await fillLabeledInput(page, '原名', originalName);
    const searchResponsePromise = waitForApiResponse(
      page,
      'GET',
      '/resource/oss/list',
    );
    await page.getByRole('button', { name: antButtonNames.search }).click();
    await expectPageEnvelope(
      await searchResponsePromise,
      'search OSS download',
    );

    const row = dataRow(page, originalName);
    await expect(row).toBeVisible();
    const fixedRow = await actionRow(row);
    const loginCheckPromise = waitForApiResponse(
      page,
      'GET',
      /\/resource\/oss\/listByIds\/1$/,
    );
    const downloadPromise = page.waitForEvent('download');
    await fixedRow.getByRole('button', { exact: true, name: '下载' }).click();
    await expectSuccessEnvelope(
      await loginCheckPromise,
      'check login before OSS download',
    );
    const download = await downloadPromise;
    expect(new URL(download.url()).pathname).toBe(
      `/prod-api/resource/oss/download/${uploadedOssId}`,
    );
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toBe(originalName);
    const downloadedPath = await download.path();
    expect(downloadedPath, 'downloaded OSS path').toBeTruthy();
    if (!downloadedPath) {
      throw new Error('downloaded OSS path is missing');
    }
    expect(await readFile(downloadedPath)).toEqual(content);

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
    await confirmRowDelete(row, '确认删除？');
    await expectSuccessEnvelope(
      await deleteResponsePromise,
      'delete downloaded OSS file',
    );
    uploadedOssId = undefined;
    await expectPageEnvelope(
      await deleteReloadPromise,
      'reload deleted OSS file',
    );
    await expect(dataRow(page, originalName)).toHaveCount(0);
  } finally {
    if (uploadedOssId && apiURL) {
      await expectSuccessEnvelope(
        await request.delete(`${apiURL}/resource/oss/${uploadedOssId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ClientID: loginEnvelope.data.client_id,
          },
        }),
        'delete OSS file during cleanup',
      );
    }
  }
});
