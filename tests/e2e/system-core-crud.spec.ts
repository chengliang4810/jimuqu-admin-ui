import type { Page } from 'playwright/test';

import type { DynamicModule } from './helpers/navigation';

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
import { fillLabeledInput, formItem, selectDepartment } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

type ResponseKind = 'list' | 'page';

async function expectReload(
  page: Page,
  responsePath: string,
  responseKind: ResponseKind,
  operation: string,
) {
  const response = await waitForApiResponse(page, 'GET', responsePath);
  if (responseKind === 'page') {
    return expectPageEnvelope(response, operation);
  }
  const envelope = await expectSuccessEnvelope<unknown[]>(response, operation);
  expect(Array.isArray(envelope.data), `${operation} data`).toBe(true);
  return envelope;
}

async function submitMutation(
  page: Page,
  method: string,
  mutationPath: RegExp | string,
  responsePath: string,
  responseKind: ResponseKind,
  operation: string,
  action: () => Promise<void>,
) {
  const mutationPromise = waitForApiResponse(page, method, mutationPath);
  const reloadPromise = expectReload(
    page,
    responsePath,
    responseKind,
    `${operation} reload`,
  );
  await action();
  await expectSuccessEnvelope(await mutationPromise, operation);
  await reloadPromise;
}

async function searchTable(
  page: Page,
  label: string,
  value: string,
  responsePath: string,
  responseKind: ResponseKind,
) {
  await fillLabeledInput(page, label, value);
  const responsePromise = expectReload(
    page,
    responsePath,
    responseKind,
    `search ${value}`,
  );
  const searchForm = formItem(page, label).locator('xpath=ancestor::form[1]');
  await searchForm.getByRole('button', { name: antButtonNames.search }).click();
  await responsePromise;
}

const roleModule: DynamicModule = {
  heading: '角色列表',
  item: '角色管理',
  parent: '系统管理',
  responseKind: 'page',
  responsePath: '/system/role/list',
  url: /\/system\/role(?:[/?#]|$)/,
};

test('role CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const roleName = `E2E角色${suffix}`;
  const updatedName = `${roleName}已编辑`;

  await openDynamicModule(page, roleModule);
  const createOverlay = await openCreateOverlay(page);
  await fillLabeledInput(createOverlay, '角色名称', roleName);
  await fillLabeledInput(createOverlay, '权限标识', `e2e_${suffix}`);
  await submitMutation(
    page,
    'POST',
    '/system/role',
    '/system/role/list',
    'page',
    'create role',
    () => submitOverlay(createOverlay),
  );
  await expect(createOverlay).toBeHidden();

  await searchTable(page, '角色名称', roleName, '/system/role/list', 'page');
  await expect(dataRow(page, roleName)).toBeVisible();

  const editOverlay = await openEditOverlay(dataRow(page, roleName));
  await fillLabeledInput(editOverlay, '角色名称', updatedName);
  await submitMutation(
    page,
    'PUT',
    '/system/role',
    '/system/role/list',
    'page',
    'update role',
    () => submitOverlay(editOverlay),
  );
  await searchTable(page, '角色名称', updatedName, '/system/role/list', 'page');
  await expect(dataRow(page, updatedName)).toBeVisible();

  await submitMutation(
    page,
    'DELETE',
    /\/system\/role\/[^/]+$/,
    '/system/role/list',
    'page',
    'delete role',
    () => confirmRowDelete(dataRow(page, updatedName), '确认删除？'),
  );
  await expect(dataRow(page, updatedName)).toHaveCount(0);
});

const deptModule: DynamicModule = {
  heading: '部门列表',
  item: '部门管理',
  parent: '系统管理',
  responseKind: 'list',
  responsePath: '/system/dept/list',
  url: /\/system\/dept(?:[/?#]|$)/,
};

test('department CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const deptName = `E2E部门${suffix}`;
  const updatedName = `${deptName}已编辑`;

  await openDynamicModule(page, deptModule);
  const createOverlay = await openCreateOverlay(page);
  await fillLabeledInput(createOverlay, '部门名称', deptName);
  await submitMutation(
    page,
    'POST',
    '/system/dept',
    '/system/dept/list',
    'list',
    'create department',
    () => submitOverlay(createOverlay),
  );
  await searchTable(page, '部门名称', deptName, '/system/dept/list', 'list');
  await expect(dataRow(page, deptName)).toBeVisible();

  const editOverlay = await openEditOverlay(dataRow(page, deptName));
  await fillLabeledInput(editOverlay, '部门名称', updatedName);
  await submitMutation(
    page,
    'PUT',
    '/system/dept',
    '/system/dept/list',
    'list',
    'update department',
    () => submitOverlay(editOverlay),
  );
  await searchTable(page, '部门名称', updatedName, '/system/dept/list', 'list');
  await expect(dataRow(page, updatedName)).toBeVisible();

  await submitMutation(
    page,
    'DELETE',
    /\/system\/dept\/[^/]+$/,
    '/system/dept/list',
    'list',
    'delete department',
    () => confirmRowDelete(dataRow(page, updatedName), '确认删除？'),
  );
  await expect(dataRow(page, updatedName)).toHaveCount(0);
});

const postModule: DynamicModule = {
  heading: '岗位列表',
  item: '岗位管理',
  parent: '系统管理',
  responseKind: 'page',
  responsePath: '/system/post/list',
  url: /\/system\/post(?:[/?#]|$)/,
};

test('post CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const postName = `E2E岗位${suffix}`;
  const updatedName = `${postName}已编辑`;

  await openDynamicModule(page, postModule);
  const createOverlay = await openCreateOverlay(page);
  await selectDepartment(page, createOverlay, '研发部');
  await fillLabeledInput(createOverlay, '岗位名称', postName);
  await fillLabeledInput(createOverlay, '岗位编码', `e2e_${suffix}`);
  await submitMutation(
    page,
    'POST',
    '/system/post',
    '/system/post/list',
    'page',
    'create post',
    () => submitOverlay(createOverlay),
  );
  await searchTable(page, '岗位名称', postName, '/system/post/list', 'page');
  await expect(dataRow(page, postName)).toBeVisible();

  const editOverlay = await openEditOverlay(dataRow(page, postName));
  await fillLabeledInput(editOverlay, '岗位名称', updatedName);
  await submitMutation(
    page,
    'PUT',
    '/system/post',
    '/system/post/list',
    'page',
    'update post',
    () => submitOverlay(editOverlay),
  );
  await searchTable(page, '岗位名称', updatedName, '/system/post/list', 'page');
  await expect(dataRow(page, updatedName)).toBeVisible();

  await submitMutation(
    page,
    'DELETE',
    /\/system\/post\/[^/]+$/,
    '/system/post/list',
    'page',
    'delete post',
    () => confirmRowDelete(dataRow(page, updatedName), '确认删除？'),
  );
  await expect(dataRow(page, updatedName)).toHaveCount(0);
});

const configModule: DynamicModule = {
  heading: '参数列表',
  item: '参数设置',
  parent: '系统管理',
  responseKind: 'page',
  responsePath: '/system/config/list',
  url: /\/system\/config(?:[/?#]|$)/,
};

test('configuration CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36);
  const configName = `E2E参数${suffix}`;
  const updatedName = `${configName}已编辑`;

  await openDynamicModule(page, configModule);
  const createOverlay = await openCreateOverlay(page);
  await fillLabeledInput(createOverlay, '参数名称', configName);
  await fillLabeledInput(createOverlay, '参数键名', `e2e.config.${suffix}`);
  await fillLabeledInput(createOverlay, '参数键值', 'initial');
  await submitMutation(
    page,
    'POST',
    '/system/config',
    '/system/config/list',
    'page',
    'create configuration',
    () => submitOverlay(createOverlay),
  );
  await searchTable(
    page,
    '参数名称',
    configName,
    '/system/config/list',
    'page',
  );
  await expect(dataRow(page, configName)).toBeVisible();

  const editOverlay = await openEditOverlay(dataRow(page, configName));
  await fillLabeledInput(editOverlay, '参数名称', updatedName);
  await fillLabeledInput(editOverlay, '参数键值', 'updated');
  await submitMutation(
    page,
    'PUT',
    '/system/config',
    '/system/config/list',
    'page',
    'update configuration',
    () => submitOverlay(editOverlay),
  );
  await searchTable(
    page,
    '参数名称',
    updatedName,
    '/system/config/list',
    'page',
  );
  await expect(dataRow(page, updatedName)).toContainText('updated');

  await submitMutation(
    page,
    'DELETE',
    /\/system\/config\/[^/]+$/,
    '/system/config/list',
    'page',
    'delete configuration',
    () => confirmRowDelete(dataRow(page, updatedName), '确认删除？'),
  );
  await expect(dataRow(page, updatedName)).toHaveCount(0);
});

const dictModule: DynamicModule = {
  heading: '字典类型列表',
  item: '字典管理',
  parent: '系统管理',
  responseKind: 'page',
  responsePath: '/system/dict/type/list',
  url: /\/system\/dict(?:[/?#]|$)/,
};

test('dictionary type CRUD is completed entirely through the web UI', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const suffix = Date.now().toString(36).replaceAll(/\d/g, 'a');
  const dictName = `E2E字典${suffix}`;
  const updatedName = `${dictName}已编辑`;

  await openDynamicModule(page, dictModule);
  const createOverlay = await openCreateOverlay(page);
  await fillLabeledInput(createOverlay, '字典名称', dictName);
  await fillLabeledInput(createOverlay, '字典类型', `eae_${suffix}`);
  await submitMutation(
    page,
    'POST',
    '/system/dict/type',
    '/system/dict/type/list',
    'page',
    'create dictionary type',
    () => submitOverlay(createOverlay),
  );
  await searchTable(
    page,
    '字典名称',
    dictName,
    '/system/dict/type/list',
    'page',
  );
  await expect(dataRow(page, dictName)).toBeVisible();

  const editOverlay = await openEditOverlay(dataRow(page, dictName));
  await fillLabeledInput(editOverlay, '字典名称', updatedName);
  await submitMutation(
    page,
    'PUT',
    '/system/dict/type',
    '/system/dict/type/list',
    'page',
    'update dictionary type',
    () => submitOverlay(editOverlay),
  );
  await searchTable(
    page,
    '字典名称',
    updatedName,
    '/system/dict/type/list',
    'page',
  );
  await expect(dataRow(page, updatedName)).toBeVisible();

  await submitMutation(
    page,
    'DELETE',
    /\/system\/dict\/type\/[^/]+$/,
    '/system/dict/type/list',
    'page',
    'delete dictionary type',
    () => confirmRowDelete(dataRow(page, updatedName), '确认删除？'),
  );
  await expect(dataRow(page, updatedName)).toHaveCount(0);
});
