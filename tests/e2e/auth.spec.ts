import { expect, test } from './fixtures';
import { expectSuccessEnvelope, waitForApiResponse } from './helpers/api';
import { loginThroughUi } from './helpers/auth';

test('forgot-password entry keeps the Bell placeholder flow', async ({
  page,
}) => {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  await page.getByText('忘记密码?', { exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/forget-password(?:[/?#]|$)/);
  await expect(page.getByRole('heading', { name: /忘记密码/ })).toBeVisible();
  await page.locator('input[placeholder="example@example.com"]').fill('bad');
  await page.getByRole('button', { name: 'submit' }).click();
  await expect(page.getByText('你输入的邮箱格式不正确')).toBeVisible();
  await page.getByRole('button', { name: /^返\s*回$/ }).click();
  await expect(page).toHaveURL(/\/auth\/login(?:[/?#]|$)/);
});

test('admin logs in through the real form and keeps the authenticated session', async ({
  authenticatedSession,
}) => {
  const { accessToken, loginEnvelope, menuEnvelope, menuResponse, page } =
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
  expect(
    (
      menuEnvelope.data as Array<{
        meta: { title: string };
        path: string;
      }>
    ).map(({ meta, path }) => ({ path, title: meta.title })),
  ).toEqual([
    { path: '/system', title: '系统管理' },
    { path: '/monitor', title: '系统监控' },
  ]);
  await expect(page).toHaveURL(/\/analytics(?:[/?#]|$)/);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/auth(?:\/|$)/);
  await expect(
    page
      .locator('.ant-menu-submenu-title:visible')
      .filter({ hasText: '系统管理' })
      .first(),
  ).toBeVisible();

  const rootMenu = page.locator('.ant-menu-root').first();
  const rootMenus = ['系统管理', '系统监控'];
  for (const title of rootMenus) {
    const menu = rootMenu
      .locator(':scope > .ant-menu-submenu > .ant-menu-submenu-title:visible')
      .filter({ hasText: title })
      .first();
    await expect(menu, `${title} must be a direct root menu`).toBeVisible();

    const icon = menu.locator(':scope > svg.ant-menu-item-icon');
    await expect(icon, `${title} icon SVG`).toBeVisible();
    expect(
      await icon.locator('path').count(),
      `${title} icon path`,
    ).toBeGreaterThan(0);
    const iconBox = await icon.boundingBox();
    expect(iconBox?.width, `${title} icon width`).toBeGreaterThan(0);
    expect(iconBox?.height, `${title} icon height`).toBeGreaterThan(0);
  }
  await expect(
    page
      .locator('.ant-menu-submenu-title:visible')
      .filter({ hasText: '资源管理' }),
  ).toHaveCount(0);
});

test('admin requests a local SMS code and logs in through the real code form', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000);
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  let accessToken: string | undefined;
  let clientId: string | undefined;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await page.goto('/auth/code-login', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/code-login(?:[/?#]|$)/);
    await expect(
      page.getByText(/测试手机号|演示使用|验证码: 1234/),
    ).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /欢迎回来/ })).toBeVisible();

    const inputs = page.locator('form input:visible');
    await expect(inputs).toHaveCount(2);
    await inputs.nth(0).fill('15888888888');
    const sendCodePromise = waitForApiResponse(
      page,
      'GET',
      '/resource/sms/code',
    );
    const sendButton = page.locator('form button').first();
    await expect(sendButton).toHaveText('获取验证码');
    await sendButton.click();
    await expectSuccessEnvelope(await sendCodePromise, 'send local SMS code');
    await expect(sendButton).toBeDisabled();
    await expect(sendButton).toContainText(/\d+秒/);

    await inputs.nth(1).fill('1234');
    const loginPromise = waitForApiResponse(page, 'POST', '/auth/login');
    const menuPromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/getRouters',
    );
    await page.locator('form button[type="submit"]').click();
    const login = await expectSuccessEnvelope<{
      access_token: string;
      client_id: string;
    }>(await loginPromise, 'SMS login');
    accessToken = login.data.access_token;
    clientId = login.data.client_id;
    const menus = await expectSuccessEnvelope<unknown[]>(
      await menuPromise,
      'load menus after SMS login',
    );
    expect(Array.isArray(menus.data)).toBe(true);
    await expect(page).toHaveURL(/\/analytics(?:[/?#]|$)/);
    await expect(
      page
        .locator('.ant-menu-submenu-title:visible')
        .filter({ hasText: '系统管理' })
        .first(),
    ).toBeVisible();
  } finally {
    if (apiURL && accessToken && clientId) {
      await expectSuccessEnvelope(
        await request.post(`${apiURL}/auth/logout`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ClientID: clientId,
          },
        }),
        'logout SMS session during cleanup',
      );
    }
  }
});

test('a disabled user is rejected by the real login form', async ({ page }) => {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  await page.locator('#username').fill('disabled_user');
  await page.locator('#password').fill('admin123');
  const loginPromise = waitForApiResponse(page, 'POST', '/auth/login');
  await page.getByRole('button', { name: 'login' }).click();
  const response = await loginPromise;
  expect(response.ok(), 'disabled login HTTP status').toBe(true);
  const body = (await response.json()) as {
    code: number;
    data: unknown;
    msg: string;
  };
  expect(Object.keys(body).toSorted()).toEqual(['code', 'data', 'msg']);
  expect(body.code).not.toBe(200);
  expect(body.data).toBeNull();
  expect(body.msg).toMatch(/禁用/);
  await expect(page).toHaveURL(/\/auth\/login(?:[/?#]|$)/);
  await expect(
    page.locator('.ant-menu-submenu-title').filter({ hasText: '系统管理' }),
  ).toHaveCount(0);
});

test('a no-permission user logs in without receiving system menus', async ({
  page,
  request,
}) => {
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  let accessToken: string | undefined;
  let clientId: string | undefined;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    const menuPromise = waitForApiResponse(
      page,
      'GET',
      '/system/menu/getRouters',
    );
    const login = await loginThroughUi(page, {
      password: 'admin123',
      username: 'no_permission',
    });
    accessToken = login.envelope.data.access_token;
    clientId = login.envelope.data.client_id;
    const menus = await expectSuccessEnvelope<unknown[]>(
      await menuPromise,
      'no-permission dynamic menu',
    );
    expect(menus.data).toEqual([]);
    await expect(page).toHaveURL(/\/analytics(?:[/?#]|$)/);
    await expect(
      page
        .locator('.ant-menu-submenu-title:visible')
        .filter({ hasText: '系统管理' }),
    ).toHaveCount(0);
    await expect(
      page
        .locator('.ant-menu-submenu-title:visible')
        .filter({ hasText: '系统监控' }),
    ).toHaveCount(0);
  } finally {
    if (apiURL && accessToken && clientId) {
      await expectSuccessEnvelope(
        await request.post(`${apiURL}/auth/logout`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ClientID: clientId,
          },
        }),
        'logout no-permission session during cleanup',
      );
    }
  }
});
