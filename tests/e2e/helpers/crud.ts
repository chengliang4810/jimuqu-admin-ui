import type { Locator, Page } from 'playwright/test';

import { expect } from 'playwright/test';

export const antButtonNames = {
  cancel: /^取\s*消$/,
  clear: /^清\s*空$/,
  confirm: /^确\s*认$/,
  confirmAction: /^(?:确\s*定|确\s*认)$/,
  create: /^新\s*增$/,
  delete: /^删\s*除$/,
  search: /^搜\s*索$/,
  unlock: /^解\s*锁$/,
} as const;

export function dataRow(page: Page, text: string) {
  return page.locator('.vxe-body--row').filter({ hasText: text }).first();
}

export function titledGrid(page: Page, title: string) {
  return page
    .getByText(title, { exact: true })
    .first()
    .locator(
      'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " vxe-grid ")][1]',
    );
}

export async function actionRow(row: Locator) {
  const rowId = await row.getAttribute('rowid');
  if (!rowId) {
    return row;
  }

  expect(rowId, 'VXE rowid').toMatch(/^[\w.-]+$/);
  const fixedRow = row
    .page()
    .locator(
      `.vxe-table--fixed-right-wrapper .vxe-body--row[rowid="${rowId}"]:visible`,
    )
    .last();
  return (await fixedRow.count()) > 0 ? fixedRow : row;
}

export async function openCreateOverlay(page: Page) {
  await page
    .getByRole('button', { name: antButtonNames.create })
    .first()
    .click();
  const overlay = page.getByRole('dialog').last();
  await expect(overlay).toBeVisible();
  await expect(
    overlay.getByText('新增', { exact: true }).first(),
  ).toBeVisible();
  await expect(
    overlay.getByRole('button', { name: antButtonNames.confirm }),
  ).toBeEnabled();
  return overlay;
}

export async function openEditOverlay(row: Locator) {
  const resolvedRow = await actionRow(row);
  await resolvedRow.getByRole('button', { name: '编辑', exact: true }).click();
  const page = row.page();
  const overlay = page.getByRole('dialog').last();
  await expect(overlay).toBeVisible();
  await expect(
    overlay.getByText('编辑', { exact: true }).first(),
  ).toBeVisible();
  return overlay;
}

export async function submitOverlay(overlay: Locator) {
  await overlay.getByRole('button', { name: antButtonNames.confirm }).click();
}

export async function confirmRowDelete(row: Locator, title: RegExp | string) {
  const resolvedRow = await actionRow(row);
  await resolvedRow.getByRole('button', { name: '删除', exact: true }).click();
  const page = row.page();
  const popconfirm = page
    .locator('.ant-popover:visible')
    .filter({ hasText: title })
    .last();
  await expect(popconfirm).toBeVisible();
  await popconfirm
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();
}
