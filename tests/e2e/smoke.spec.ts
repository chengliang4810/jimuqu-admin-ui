import { expect, test } from './fixtures';
import { expectSuccessEnvelope } from './helpers/api';

test('backend and login page are reachable', async ({ page, request }) => {
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  expect(
    apiURL,
    'PLAYWRIGHT_API_URL must be provided by test-fullstack.ps1',
  ).toBeTruthy();

  const apiResponse = await request.get(`${apiURL}/auth/code`);
  const apiEnvelope = await expectSuccessEnvelope<{
    captchaEnabled: boolean;
  }>(apiResponse, 'backend readiness');
  expect(apiEnvelope.data.captchaEnabled).toBe(false);

  const response = await page.goto('/auth/login', {
    waitUntil: 'domcontentloaded',
  });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole('button', { name: 'login' })).toBeVisible();
});
