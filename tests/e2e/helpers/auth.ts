import type { Page, Response } from 'playwright/test';

import type { ApiEnvelope } from './api';

import process from 'node:process';

import { expect } from 'playwright/test';

import { expectSuccessEnvelope, waitForApiResponse } from './api';

export interface LoginResult {
  access_token: string;
  client_id: string;
  expire_in: number;
}

export interface LoginOutcome {
  envelope: ApiEnvelope<LoginResult>;
  response: Response;
}

export interface LoginCredentials {
  password: string;
  username: string;
}

const defaultCredentials: LoginCredentials = {
  password: process.env.E2E_PASSWORD ?? 'admin123',
  username: process.env.E2E_USERNAME ?? 'admin',
};

export async function loginThroughUi(
  page: Page,
  credentials: LoginCredentials = defaultCredentials,
): Promise<LoginOutcome> {
  const navigationResponse = await page.goto('/auth/login', {
    waitUntil: 'domcontentloaded',
  });
  expect(navigationResponse?.status(), 'login page HTTP status').toBeLessThan(
    400,
  );

  const usernameInput = page.locator('#username');
  const passwordInput = page.locator('#password');
  const loginButton = page.getByRole('button', { name: 'login' });

  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(
    page.locator('#code'),
    'full-stack E2E requires captcha.enable=false',
  ).toHaveCount(0);

  await usernameInput.fill(credentials.username);
  await passwordInput.fill(credentials.password);
  await expect(loginButton).toBeEnabled();

  const responsePromise = waitForApiResponse(page, 'POST', '/auth/login');
  await loginButton.click();
  const response = await responsePromise;
  const envelope = await expectSuccessEnvelope<LoginResult>(response, 'login');

  expect(envelope.data.access_token, 'login access token').toBeTruthy();
  await expect(page).not.toHaveURL(/\/auth(?:\/|$)/, { timeout: 30_000 });

  return { envelope, response };
}
