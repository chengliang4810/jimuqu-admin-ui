import type { Locator, Page } from 'playwright/test';

import { readFile } from 'node:fs/promises';

import { expect } from 'playwright/test';

import { waitForApiResponse } from './api';

export async function expectExcelExport(
  page: Page,
  path: RegExp | string,
  operation: string,
  scope: Locator | Page = page,
) {
  const responsePromise = waitForApiResponse(page, 'POST', path);
  const downloadPromise = page.waitForEvent('download');
  await scope.getByRole('button', { name: /^导\s*出$/ }).click();
  const [response, download] = await Promise.all([
    responsePromise,
    downloadPromise,
  ]);

  expect(response.ok(), `${operation} HTTP ${response.status()}`).toBe(true);
  expect(download.suggestedFilename(), `${operation} file name`).toMatch(
    /\.xlsx$/i,
  );
  const pathOnDisk = await download.path();
  expect(pathOnDisk, `${operation} downloaded path`).toBeTruthy();
  if (!pathOnDisk) {
    throw new Error(`${operation} downloaded path is missing`);
  }
  expect(
    (await readFile(pathOnDisk)).byteLength,
    `${operation} file size`,
  ).toBeGreaterThan(0);
}
