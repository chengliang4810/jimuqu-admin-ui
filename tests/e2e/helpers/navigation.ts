import type { Page } from 'playwright/test';

import { expect } from 'playwright/test';

import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './api';

export interface DynamicModule {
  heading: string;
  item: string;
  parent: string;
  responseKind: 'list' | 'object' | 'page';
  responsePath: string;
  url: RegExp;
}

export async function openDynamicModule(page: Page, module: DynamicModule) {
  const parentMenu = page
    .locator('.ant-menu-submenu-title:visible')
    .filter({ hasText: module.parent })
    .first();
  const itemMenu = page
    .locator('.ant-menu-item:visible')
    .filter({ hasText: module.item })
    .first();

  if (!(await itemMenu.isVisible())) {
    await expect(parentMenu, `dynamic ${module.parent} menu`).toBeVisible();
    await parentMenu.click();
  }
  await expect(itemMenu, `dynamic ${module.item} menu`).toBeVisible();

  const responsePromise = waitForApiResponse(page, 'GET', module.responsePath);
  await itemMenu.click();
  const response = await responsePromise;

  let envelope;
  if (module.responseKind === 'page') {
    envelope = await expectPageEnvelope(
      response,
      `${module.item} initial data`,
    );
  } else {
    envelope = await expectSuccessEnvelope<unknown>(
      response,
      `${module.item} initial data`,
    );
    if (module.responseKind === 'list') {
      expect(Array.isArray(envelope.data), `${module.item} data`).toBe(true);
    }
  }

  await expect(page).toHaveURL(module.url);
  await expect(
    page.getByText(module.heading, { exact: false }).first(),
  ).toBeVisible();
  return envelope;
}

export async function openUserManagement(page: Page) {
  const systemMenu = page
    .locator('.ant-menu-submenu-title:visible')
    .filter({ hasText: '系统管理' })
    .first();
  const userMenu = page
    .locator('.ant-menu-item:visible')
    .filter({ hasText: '用户管理' })
    .first();

  if (!(await userMenu.isVisible())) {
    await expect(systemMenu, 'dynamic 系统管理 menu').toBeVisible();
    await systemMenu.click();
  }
  await expect(userMenu, 'dynamic 用户管理 menu').toBeVisible();

  const listResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/system/user/list',
  );
  await userMenu.click();
  const listEnvelope = await expectPageEnvelope(
    await listResponsePromise,
    'initial user list',
  );

  await expect(page).toHaveURL(/\/system\/user(?:[/?#]|$)/);
  await expect(page.getByText('用户列表', { exact: true })).toBeVisible();
  return listEnvelope;
}
