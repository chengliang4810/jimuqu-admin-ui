import type { APIRequestContext, Page, Response } from 'playwright/test';

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
  submitOverlay,
  titledGrid,
} from './helpers/crud';
import { fillLabeledInput, formItem } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

interface TreeNode {
  children?: TreeNode[];
  id: string;
  label: string;
}

interface RoleRow {
  dataScope: string;
  roleId: string;
  roleName: string;
}

interface UserRow {
  userId: string;
  userName: string;
}

interface PermissionResponses {
  dept: Response;
  menu: Response;
  role: Response;
}

function findNode(nodes: TreeNode[], label: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.label === label) return node;
    const child = findNode(node.children ?? [], label);
    if (child) return child;
  }
}

function firstLeaf(node: TreeNode): TreeNode {
  const [firstChild] = node.children ?? [];
  return firstChild ? firstLeaf(firstChild) : node;
}

async function searchRole(page: Page, roleName: string) {
  await fillLabeledInput(page, '角色名称', roleName);
  const responsePromise = waitForApiResponse(page, 'GET', '/system/role/list');
  const form = formItem(page, '角色名称').locator('xpath=ancestor::form[1]');
  await form.getByRole('button', { name: antButtonNames.search }).click();
  return expectPageEnvelope<RoleRow>(
    await responsePromise,
    `search ${roleName}`,
  );
}

async function openPermission(page: Page, roleId: string, roleName: string) {
  const rolePromise = waitForApiResponse(page, 'GET', `/system/role/${roleId}`);
  const menuPromise = waitForApiResponse(
    page,
    'GET',
    `/system/menu/roleMenuTreeselect/${roleId}`,
  );
  const deptPromise = waitForApiResponse(
    page,
    'GET',
    `/system/role/deptTree/${roleId}`,
  );
  const fixedRow = await actionRow(dataRow(page, roleName));
  await fixedRow.getByRole('button', { name: '权限', exact: true }).click();
  const [role, menu, dept] = await Promise.all([
    rolePromise,
    menuPromise,
    deptPromise,
  ]);
  const responses: PermissionResponses = { dept, menu, role };
  const dialog = page.getByRole('dialog').last();
  await expect(dialog.getByText('分配权限', { exact: true })).toBeVisible();
  return { dialog, responses };
}

async function cleanupRole(
  request: APIRequestContext,
  apiURL: string,
  headers: Record<string, string>,
  roleName: string,
  assignedUserId?: string,
) {
  const response = await request.get(`${apiURL}/system/role/list`, {
    headers,
    params: { pageNum: 1, pageSize: 10, roleName },
  });
  if (!response.ok()) return;
  const body = (await response.json()) as { data?: { rows?: RoleRow[] } };
  const role = body.data?.rows?.find((row) => row.roleName === roleName);
  if (!role) return;
  if (assignedUserId) {
    await request.put(`${apiURL}/system/role/authUser/cancel`, {
      data: { roleId: role.roleId, userId: assignedUserId },
      headers,
    });
  }
  await request.delete(`${apiURL}/system/role/${role.roleId}`, { headers });
}

test('role menu, data scope and user assignment persist through the web UI', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(240_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const suffix = Date.now().toString(36);
  const roleName = `E2E权限角色${suffix}`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  let assignedUserId: string | undefined;
  let cleaned = false;

  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await openDynamicModule(page, {
      heading: '角色列表',
      item: '角色管理',
      parent: '系统管理',
      responseKind: 'page',
      responsePath: '/system/role/list',
      url: /\/system\/role(?:[/?#]|$)/,
    });

    const createOverlay = await openCreateOverlay(page);
    await fillLabeledInput(createOverlay, '角色名称', roleName);
    await fillLabeledInput(
      createOverlay,
      '权限标识',
      `e2e_permission_${suffix}`,
    );
    const createPromise = waitForApiResponse(page, 'POST', '/system/role');
    const createReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/list',
    );
    await submitOverlay(createOverlay);
    await expectSuccessEnvelope(await createPromise, 'create permission role');
    await expectPageEnvelope(
      await createReloadPromise,
      'reload permission role',
    );

    const roles = await searchRole(page, roleName);
    const role = roles.data.rows.find((row) => row.roleName === roleName);
    expect(role, 'created role').toBeTruthy();
    if (!role) throw new Error('created role is missing');

    const firstOpen = await openPermission(page, role.roleId, roleName);
    const firstMenu = await expectSuccessEnvelope<{
      checkedKeys: string[];
      menus: TreeNode[];
    }>(firstOpen.responses.menu, 'load role menus');
    const firstDept = await expectSuccessEnvelope<{
      checkedKeys: string[];
      depts: TreeNode[];
    }>(firstOpen.responses.dept, 'load role departments');
    await expectSuccessEnvelope(firstOpen.responses.role, 'load role details');
    const userMenu = findNode(firstMenu.data.menus, '用户管理');
    const researchDept = findNode(firstDept.data.depts, '研发部');
    expect(userMenu, '用户管理 menu node').toBeTruthy();
    expect(researchDept, '研发部 department node').toBeTruthy();
    if (!userMenu || !researchDept) {
      throw new Error('required permission tree nodes are missing');
    }
    const userMenuLeaf = firstLeaf(userMenu);

    const menuRow = firstOpen.dialog
      .locator('#menu-select-table .vxe-body--row')
      .filter({ hasText: '用户管理' })
      .first();
    await expect(menuRow).toBeVisible();
    await menuRow.locator('.vxe-cell--checkbox').click();
    await expect(menuRow.locator('.vxe-cell--checkbox')).toHaveClass(
      /is--checked/,
    );

    await firstOpen.dialog.getByText('数据权限', { exact: true }).click();
    const scopeSelect = firstOpen.dialog.locator('.ant-select:visible').last();
    await scopeSelect.click();
    await page
      .locator('.ant-select-dropdown:visible .ant-select-item-option')
      .filter({ hasText: '自定数据权限' })
      .click();
    const deptNode = firstOpen.dialog
      .locator('.ant-tree-treenode')
      .filter({ hasText: '研发部' })
      .first();
    await deptNode.locator('.ant-tree-checkbox').click();

    const permissionPromise = waitForApiResponse(
      page,
      'PUT',
      '/system/role/permission',
    );
    const permissionReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/list',
    );
    await submitOverlay(firstOpen.dialog);
    await expectSuccessEnvelope(
      await permissionPromise,
      'save role permissions',
    );
    await expectPageEnvelope(
      await permissionReloadPromise,
      'reload saved role permissions',
    );

    const pageReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/list',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectPageEnvelope(await pageReloadPromise, 'reload role page');
    await searchRole(page, roleName);
    const secondOpen = await openPermission(page, role.roleId, roleName);
    const persistedRole = await expectSuccessEnvelope<RoleRow>(
      secondOpen.responses.role,
      'reload role details',
    );
    const persistedMenu = await expectSuccessEnvelope<{
      checkedKeys: string[];
    }>(secondOpen.responses.menu, 'reload role menus');
    const persistedDept = await expectSuccessEnvelope<{
      checkedKeys: string[];
    }>(secondOpen.responses.dept, 'reload role departments');
    expect(persistedRole.data.dataScope).toBe('2');
    expect(persistedMenu.data.checkedKeys.map(String)).toContain(
      String(userMenuLeaf.id),
    );
    expect(persistedDept.data.checkedKeys.map(String)).toContain(
      String(firstLeaf(researchDept).id),
    );
    await secondOpen.dialog
      .getByRole('button', { name: antButtonNames.cancel })
      .click();

    const allocatedPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/authUser/allocatedList',
    );
    await dataRow(page, roleName).getByText(roleName).click();
    await expectPageEnvelope(await allocatedPromise, 'select role users');
    await expect(
      page.getByText(`[${roleName}]授权用户`, { exact: true }),
    ).toBeVisible();

    const unallocatedPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/authUser/unallocatedList',
    );
    await titledGrid(page, `[${roleName}]授权用户`)
      .getByRole('button', { name: '授权用户' })
      .click();
    await expectPageEnvelope(
      await unallocatedPromise,
      'open unallocated users',
    );
    const drawer = page.getByRole('dialog').last();
    await fillLabeledInput(drawer, '用户账号', 'no_permission');
    const userSearchPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/authUser/unallocatedList',
    );
    const userSearchForm = formItem(drawer, '用户账号').locator(
      'xpath=ancestor::form[1]',
    );
    await userSearchForm
      .getByRole('button', { name: antButtonNames.search })
      .click();
    const users = await expectPageEnvelope<UserRow>(
      await userSearchPromise,
      'search unallocated user',
    );
    const targetUser = users.data.rows.find(
      (row) => row.userName === 'no_permission',
    );
    expect(targetUser, 'no_permission unallocated user').toBeTruthy();
    if (!targetUser) throw new Error('unallocated user is missing');
    assignedUserId = targetUser.userId;

    const unallocatedRow = drawer
      .locator('.vxe-body--row')
      .filter({ hasText: 'no_permission' })
      .first();
    await unallocatedRow.locator('.vxe-cell--checkbox').click();
    const assignPromise = waitForApiResponse(
      page,
      'PUT',
      '/system/role/authUser/selectAll',
    );
    const assignReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/authUser/allocatedList',
    );
    await submitOverlay(drawer);
    await expectSuccessEnvelope(await assignPromise, 'assign role user');
    const assigned = await expectPageEnvelope<UserRow>(
      await assignReloadPromise,
      'reload assigned users',
    );
    expect(assigned.data.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userName: 'no_permission' }),
      ]),
    );

    const assignedGrid = titledGrid(page, `[${roleName}]授权用户`);
    const assignedRow = assignedGrid
      .locator('.vxe-body--row')
      .filter({ hasText: 'no_permission' })
      .first();
    await assignedRow.locator('.vxe-cell--checkbox').click();
    const cancelButton = assignedGrid.getByRole('button', {
      name: '取消授权',
    });
    await expect(cancelButton).toBeEnabled();
    await cancelButton.click();
    const cancelConfirm = page.locator('.ant-modal-confirm:visible').last();
    const cancelPromise = waitForApiResponse(
      page,
      'PUT',
      '/system/role/authUser/cancelAll',
    );
    const cancelReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/authUser/allocatedList',
    );
    await cancelConfirm
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(await cancelPromise, 'cancel role user');
    const cancelled = await expectPageEnvelope<UserRow>(
      await cancelReloadPromise,
      'reload cancelled users',
    );
    expect(cancelled.data.rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userName: 'no_permission' }),
      ]),
    );
    assignedUserId = undefined;

    await searchRole(page, roleName);
    const deletePromise = waitForApiResponse(
      page,
      'DELETE',
      /\/system\/role\/[^/]+$/,
    );
    const deleteReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/role/list',
    );
    await confirmRowDelete(dataRow(page, roleName), '确认删除？');
    await expectSuccessEnvelope(await deletePromise, 'delete permission role');
    await expectPageEnvelope(await deleteReloadPromise, 'reload deleted role');
    cleaned = true;
  } finally {
    if (!cleaned && apiURL) {
      await cleanupRole(request, apiURL, headers, roleName, assignedUserId);
    }
  }
});
