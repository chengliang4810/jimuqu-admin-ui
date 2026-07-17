import type { Locator, Page } from 'playwright/test';

import { expect } from 'playwright/test';

type FormScope = Locator | Page;

export function formItem(scope: FormScope, label: string) {
  return scope
    .locator('.ant-form-item:visible')
    .filter({ hasText: label })
    .first();
}

export async function fillLabeledInput(
  scope: FormScope,
  label: string,
  value: string,
) {
  const input = formItem(scope, label)
    .locator('input:not([type="hidden"]), textarea')
    .first();
  await expect(input, `${label} input`).toBeVisible();
  await input.fill(value);
}

async function openLabeledSelect(scope: FormScope, label: string) {
  const selector = formItem(scope, label).getByRole('combobox').first();
  await expect(selector, `${label} select`).toBeVisible();
  await selector.click();
}

export async function selectOption(
  page: Page,
  scope: FormScope,
  label: string,
  optionText: string,
  keepOpen = false,
) {
  await openLabeledSelect(scope, label);
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(dropdown).toBeVisible();
  const option = dropdown
    .locator('.ant-select-item-option:not(.ant-select-item-option-disabled)')
    .filter({ hasText: optionText })
    .first();
  await expect(option, `${optionText} option`).toBeVisible();
  await option.click();
  if (keepOpen) {
    await page.keyboard.press('Escape');
  }
}

export async function selectSafeRole(page: Page, dialog: Locator) {
  await openLabeledSelect(dialog, '所属角色');
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(dropdown).toBeVisible();

  const enabledOptions = dropdown.locator(
    '.ant-select-item-option:not(.ant-select-item-option-disabled)',
  );
  let option = enabledOptions.filter({ hasText: '本部门及以下' }).first();
  if ((await option.count()) === 0) {
    option = enabledOptions.filter({ hasText: '普通角色' }).first();
  }
  if ((await option.count()) === 0) {
    option = enabledOptions.filter({ hasNotText: '超级管理员' }).first();
  }

  expect(await option.count(), 'a non-super-admin role option').toBeGreaterThan(
    0,
  );
  await option.click();
  await page.keyboard.press('Escape');
}

export async function selectDepartment(
  page: Page,
  dialog: Locator,
  departmentName: string,
) {
  await selectTreeOption(page, dialog, '所属部门', departmentName);
}

export async function selectTreeOption(
  page: Page,
  scope: FormScope,
  label: string,
  optionText: string,
) {
  await openLabeledSelect(scope, label);
  const option = page
    .locator('.ant-select-tree-node-content-wrapper:visible')
    .filter({ hasText: optionText })
    .first();
  await expect(option, `${optionText} tree option`).toBeVisible();
  await option.click();
}
