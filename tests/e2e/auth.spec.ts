import { expect, test } from './fixtures';

test('admin logs in through the real form and keeps the authenticated session', async ({
  authenticatedSession,
}) => {
  const { accessToken, loginEnvelope, menuResponse, page } =
    authenticatedSession;

  expect(loginEnvelope).toEqual({
    code: 200,
    data: expect.objectContaining({
      access_token: expect.any(String),
      client_id: expect.any(String),
      expire_in: expect.any(Number),
    }),
    msg: expect.any(String),
  });
  expect(menuResponse.request().headers().authorization).toBe(
    `Bearer ${accessToken}`,
  );
  await expect(page).toHaveURL(/\/analytics(?:[/?#]|$)/);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/auth(?:\/|$)/);
  await expect(
    page
      .locator('.ant-menu-submenu-title:visible')
      .filter({ hasText: '系统管理' })
      .first(),
  ).toBeVisible();
});
