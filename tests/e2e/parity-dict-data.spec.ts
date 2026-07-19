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
  submitOverlay,
  titledGrid,
} from './helpers/crud';
import { expectExcelExport } from './helpers/download';
import { fillLabeledInput, formItem } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

interface DictDataRow {
  dictCode: string;
  dictLabel: string;
  dictType: string;
  dictValue: string;
}

interface DictTypeRow {
  dictId: string;
  dictName: string;
  dictType: string;
}

const typeGrid = '字典类型列表';
const dataGrid = '字典数据列表';

function gridRow(page: Page, grid: string, text: string) {
  return titledGrid(page, grid)
    .locator('.vxe-body--row')
    .filter({ hasText: text })
    .first();
}

async function searchTable<T>(
  page: Page,
  label: string,
  value: string,
  path: string,
) {
  await fillLabeledInput(page, label, value);
  const responsePromise = waitForApiResponse(page, 'GET', path);
  const form = formItem(page, label).locator('xpath=ancestor::form[1]');
  await form.getByRole('button', { name: antButtonNames.search }).click();
  return expectPageEnvelope<T>(await responsePromise, `search ${value}`);
}

async function openCreateFromGrid(page: Page, grid: string) {
  await titledGrid(page, grid)
    .getByRole('button', { name: antButtonNames.create })
    .click();
  const overlay = page.getByRole('dialog').last();
  await expect(overlay).toBeVisible();
  await expect(
    overlay.getByText('新增', { exact: true }).first(),
  ).toBeVisible();
  return overlay;
}

async function cleanupDictionary(
  request: APIRequestContext,
  apiURL: string,
  headers: Record<string, string>,
  dictType: string,
) {
  const dataResponse = await request.get(`${apiURL}/system/dict/data/list`, {
    headers,
    params: { dictType, pageNum: 1, pageSize: 100 },
  });
  if (dataResponse.ok()) {
    const dataBody = (await dataResponse.json()) as {
      data?: { rows?: DictDataRow[] };
    };
    const ids = dataBody.data?.rows?.map((row) => row.dictCode) ?? [];
    if (ids.length > 0) {
      await request.delete(`${apiURL}/system/dict/data/${ids.join(',')}`, {
        headers,
      });
    }
  }

  const typeResponse = await request.get(`${apiURL}/system/dict/type/list`, {
    headers,
    params: { dictType, pageNum: 1, pageSize: 10 },
  });
  if (!typeResponse.ok()) return;
  const typeBody = (await typeResponse.json()) as {
    data?: { rows?: DictTypeRow[] };
  };
  const type = typeBody.data?.rows?.find((row) => row.dictType === dictType);
  if (type) {
    await request.delete(`${apiURL}/system/dict/type/${type.dictId}`, {
      headers,
    });
  }
}

test('dictionary data CRUD and cache refresh persist through the web UI', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(180_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const suffix = Date.now().toString(36).replaceAll(/\d/g, 'x');
  const dictName = `E2E数据字典${suffix}`;
  const dictType = `e_e_data_${suffix}`;
  const initialLabel = `E2E标签${suffix}`;
  const updatedLabel = `${initialLabel}已编辑`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  let cleaned = false;

  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await openDynamicModule(page, {
      heading: '字典类型列表',
      item: '字典管理',
      parent: '系统管理',
      responseKind: 'page',
      responsePath: '/system/dict/type/list',
      url: /\/system\/dict(?:[/?#]|$)/,
    });

    const typeOverlay = await openCreateFromGrid(page, typeGrid);
    await fillLabeledInput(typeOverlay, '字典名称', dictName);
    await fillLabeledInput(typeOverlay, '字典类型', dictType);
    const createTypePromise = waitForApiResponse(
      page,
      'POST',
      '/system/dict/type',
    );
    const reloadTypePromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/type/list',
    );
    await submitOverlay(typeOverlay);
    await expectSuccessEnvelope(
      await createTypePromise,
      'create dictionary type',
    );
    await expectPageEnvelope(
      await reloadTypePromise,
      'reload dictionary types',
    );

    const types = await searchTable<DictTypeRow>(
      page,
      '字典名称',
      dictName,
      '/system/dict/type/list',
    );
    expect(types.data.rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ dictName, dictType })]),
    );

    const initialDataPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/data/list',
    );
    await gridRow(page, typeGrid, dictName).getByText(dictName).click();
    const initialData = await expectPageEnvelope<DictDataRow>(
      await initialDataPromise,
      'select dictionary type',
    );
    expect(initialData.data.rows).toEqual([]);

    const dataOverlay = await openCreateFromGrid(page, dataGrid);
    await fillLabeledInput(dataOverlay, '数据标签', initialLabel);
    await fillLabeledInput(dataOverlay, '数据键值', `value_${suffix}`);
    await fillLabeledInput(dataOverlay, '备注', 'created through Playwright');
    const createDataPromise = waitForApiResponse(
      page,
      'POST',
      '/system/dict/data',
    );
    const reloadDataPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/data/list',
    );
    await submitOverlay(dataOverlay);
    await expectSuccessEnvelope(
      await createDataPromise,
      'create dictionary data',
    );
    await expectPageEnvelope(await reloadDataPromise, 'reload dictionary data');

    const createdData = await searchTable<DictDataRow>(
      page,
      '字典标签',
      initialLabel,
      '/system/dict/data/list',
    );
    expect(createdData.data.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dictLabel: initialLabel, dictType }),
      ]),
    );

    const editOverlay = await openEditOverlay(
      gridRow(page, dataGrid, initialLabel),
    );
    await fillLabeledInput(editOverlay, '数据标签', updatedLabel);
    const updatePromise = waitForApiResponse(page, 'PUT', '/system/dict/data');
    const updateReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/data/list',
    );
    await submitOverlay(editOverlay);
    await expectSuccessEnvelope(await updatePromise, 'update dictionary data');
    await expectPageEnvelope(
      await updateReloadPromise,
      'reload updated dictionary data',
    );

    const pageReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/type/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPageEnvelope(await pageReloadPromise, 'reload dictionary page');
    await searchTable(page, '字典名称', dictName, '/system/dict/type/list');
    const persistedDataPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/data/list',
    );
    await gridRow(page, typeGrid, dictName).getByText(dictName).click();
    await expectPageEnvelope(
      await persistedDataPromise,
      'reload selected dictionary',
    );
    await searchTable(page, '字典标签', updatedLabel, '/system/dict/data/list');
    await expect(gridRow(page, dataGrid, updatedLabel)).toContainText(
      'created through Playwright',
    );

    const refreshPromise = waitForApiResponse(
      page,
      'DELETE',
      '/system/dict/type/refreshCache',
    );
    const refreshReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/type/list',
    );
    await titledGrid(page, typeGrid)
      .getByRole('button', { name: '刷新缓存' })
      .click();
    const refreshConfirm = page.locator('.ant-popover:visible').last();
    await refreshConfirm
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(
      await refreshPromise,
      'refresh dictionary cache',
    );
    await expectPageEnvelope(
      await refreshReloadPromise,
      'reload after dictionary cache refresh',
    );

    await expectExcelExport(
      page,
      '/system/dict/data/export',
      'export dictionary data',
      titledGrid(page, dataGrid),
    );

    const deleteDataPromise = waitForApiResponse(
      page,
      'DELETE',
      /\/system\/dict\/data\/[^/]+$/,
    );
    const deleteDataReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/data/list',
    );
    await confirmRowDelete(gridRow(page, dataGrid, updatedLabel), '确认删除？');
    await expectSuccessEnvelope(
      await deleteDataPromise,
      'delete dictionary data',
    );
    await expectPageEnvelope(
      await deleteDataReloadPromise,
      'reload deleted dictionary data',
    );
    await expect(gridRow(page, dataGrid, updatedLabel)).toHaveCount(0);

    const deleteTypePromise = waitForApiResponse(
      page,
      'DELETE',
      /\/system\/dict\/type\/[^/]+$/,
    );
    const deleteTypeReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/dict/type/list',
    );
    await confirmRowDelete(gridRow(page, typeGrid, dictName), '确认删除？');
    await expectSuccessEnvelope(
      await deleteTypePromise,
      'delete dictionary type',
    );
    await expectPageEnvelope(
      await deleteTypeReloadPromise,
      'reload deleted dictionary type',
    );
    cleaned = true;
  } finally {
    if (!cleaned && apiURL) {
      await cleanupDictionary(request, apiURL, headers, dictType);
    }
  }
});
