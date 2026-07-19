import type { BrowserContext, Page, Response } from 'playwright/test';

import { Buffer } from 'node:buffer';

import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import { loginThroughUi } from './helpers/auth';
import { actionRow, antButtonNames } from './helpers/crud';
import { fillLabeledInput, formItem } from './helpers/form';

interface ProfileData {
  user: {
    avatar?: string;
    email: string;
    nickName: string;
    phoneNumber: string;
    sex: string;
    userId: number | string;
  };
}

interface SocialData {
  id: string;
  nickName: string;
  source: string;
  userName: string;
}

interface SocialLoginData {
  access_token: string;
  client_id: string;
  expire_in: number;
}

function giteeBindingCard(page: Page) {
  return page
    .locator('.ant-card')
    .filter({ has: page.getByText('Gitee', { exact: true }) })
    .first();
}

async function openProfileFromUserMenu(page: Page) {
  const avatar = page.locator('header .ant-avatar').last();
  await expect(avatar, 'header user avatar').toBeVisible();
  await avatar.click();
  const profileItem = page.getByText('个人中心', { exact: true }).last();
  await expect(profileItem, 'personal center user menu item').toBeVisible();
  const profilePromise = waitForApiResponse(
    page,
    'GET',
    '/system/user/profile',
  );
  await profileItem.click();
  const profile = await expectSuccessEnvelope<ProfileData>(
    await profilePromise,
    'load user profile',
  );
  await expect(page).toHaveURL(/\/profile(?:[/?#]|$)/);
  return profile;
}

function recordBrowserIssues(page: Page) {
  const issues: string[] = [];
  const resourceTypes = new Set(['font', 'image', 'script', 'stylesheet']);
  page.on('console', (message) => {
    if (message.type() === 'error') {
      issues.push(`console.error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (resourceTypes.has(request.resourceType())) {
      issues.push(
        `${request.method()} ${request.url()} ${request.failure()?.errorText ?? 'failed'}`,
      );
    }
  });
  page.on('response', (response: Response) => {
    if (
      response.status() >= 500 ||
      (response.status() >= 400 &&
        resourceTypes.has(response.request().resourceType()))
    ) {
      issues.push(
        `${response.status()} ${response.request().method()} ${response.url()}`,
      );
    }
  });
  return issues;
}

function formatDateTime(value: number) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function expectJsonTransportResponse(
  response: Response,
  operation: string,
) {
  expect(response.status(), `${operation} HTTP status`).toBe(200);
  expect(
    response.headers()['content-type'],
    `${operation} content type`,
  ).toContain('application/json');
}

test('profile, avatar, Gitee binding and social login persist through the web UI', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(180_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  let currentAccessToken = accessToken;
  let currentClientId = loginEnvelope.data.client_id;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();
  if (!apiURL) throw new Error('PLAYWRIGHT_API_URL is required');
  const initialHeaders = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: currentClientId,
  };
  const existingSocialAccounts = await expectSuccessEnvelope<SocialData[]>(
    await request.get(`${apiURL}/system/social/list`, {
      headers: initialHeaders,
    }),
    'load social accounts before profile test',
  );
  for (const social of existingSocialAccounts.data.filter(
    (item) => item.source.toLowerCase() === 'gitee',
  )) {
    await expectSuccessEnvelope(
      await request.delete(`${apiURL}/auth/unlock/${social.id}`, {
        headers: initialHeaders,
      }),
      'reset Gitee binding before profile test',
    );
  }
  const socialListPromise = waitForApiResponse(
    page,
    'GET',
    '/system/social/list',
  );
  const profile = await openProfileFromUserMenu(page);
  const originalAvatar = profile.data.user.avatar ?? '';
  const originalNick = profile.data.user.nickName;
  let uploadedOssId: string | undefined;

  try {
    await page.getByRole('tab', { name: '账号绑定' }).click();
    await expect(page.getByText(/需要添加第三方账号/)).toHaveCount(0);
    const socialList = await expectSuccessEnvelope<unknown[]>(
      await socialListPromise,
      'load bound social accounts',
    );
    expect(Array.isArray(socialList.data)).toBe(true);
    expect(
      (socialList.data as SocialData[]).filter(
        (social) => social.source.toLowerCase() === 'gitee',
      ),
      'the isolated user must start without a Gitee binding',
    ).toEqual([]);
    const unboundGiteeCard = giteeBindingCard(page);
    await expect(unboundGiteeCard).toContainText('绑定Gitee账号');
    await expect(
      unboundGiteeCard.getByRole('button', { exact: true, name: '绑定' }),
    ).toBeVisible();

    const bindingContract = await expectSuccessEnvelope<string>(
      await request.get(`${apiURL}/auth/binding/gitee`, {
        headers: initialHeaders,
      }),
      'verify Gitee account binding contract',
    );
    const contractAuthorizeUrl = new URL(bindingContract.data);
    expect(contractAuthorizeUrl.pathname).toBe('/social-callback');
    expect(contractAuthorizeUrl.searchParams.get('source')).toBe('gitee');
    expect(contractAuthorizeUrl.searchParams.get('code')).toBe(
      'http-contract-code',
    );
    expect(contractAuthorizeUrl.searchParams.get('state')).toBeTruthy();

    const bindingPromise = waitForApiResponse(
      page,
      'GET',
      '/auth/binding/gitee',
    );
    const callbackNavigationPromise = page.waitForRequest((request) => {
      if (!request.isNavigationRequest()) return false;
      const url = new URL(request.url());
      return (
        url.pathname === '/social-callback' &&
        url.searchParams.get('source') === 'gitee'
      );
    });
    const callbackPromise = waitForApiResponse(
      page,
      'POST',
      '/auth/social/callback',
    );
    await unboundGiteeCard
      .getByRole('button', { exact: true, name: '绑定' })
      .click();
    await expectJsonTransportResponse(
      await bindingPromise,
      'start Gitee account binding',
    );
    const authorizeUrl = new URL((await callbackNavigationPromise).url());
    expect(authorizeUrl.pathname).toBe('/social-callback');
    expect(authorizeUrl.searchParams.get('source')).toBe('gitee');
    expect(authorizeUrl.searchParams.get('code')).toBe('http-contract-code');
    expect(authorizeUrl.searchParams.get('state')).toBeTruthy();
    expect(authorizeUrl.searchParams.get('state')).not.toBe(
      contractAuthorizeUrl.searchParams.get('state'),
    );
    await expect(page).toHaveURL(/\/social-callback\?.*source=gitee/);
    await expectSuccessEnvelope(
      await callbackPromise,
      'complete Gitee account binding callback',
    );
    await expect(page).not.toHaveURL(/\/social-callback(?:[/?#]|$)/, {
      timeout: 15_000,
    });

    const boundSocialListPromise = waitForApiResponse(
      page,
      'GET',
      '/system/social/list',
    );
    await openProfileFromUserMenu(page);
    await page.getByRole('tab', { name: '账号绑定' }).click();
    const boundSocialList = await expectSuccessEnvelope<SocialData[]>(
      await boundSocialListPromise,
      'reload bound social accounts',
    );
    const gitee = boundSocialList.data.find(
      (social) => social.source.toLowerCase() === 'gitee',
    );
    expect(gitee, 'Gitee binding must be persisted').toEqual(
      expect.objectContaining({
        nickName: 'HTTP Contract Social',
        source: 'gitee',
        userName: 'http_contract_social',
      }),
    );
    if (!gitee) throw new Error('persisted Gitee binding is missing');
    const boundGiteeCard = giteeBindingCard(page);
    await expect(boundGiteeCard).toContainText('已绑定: HTTP Contract Social');

    const avatar = page.locator('header .ant-avatar').last();
    await expect(
      avatar,
      'header user avatar before social login',
    ).toBeVisible();
    await avatar.click();
    const logoutItem = page
      .getByRole('img', { name: 'logout' })
      .locator('xpath=..');
    await expect(logoutItem).toBeVisible();
    const closeSsePromise = waitForApiResponse(
      page,
      'GET',
      '/resource/message/close',
    );
    const logoutPromise = waitForApiResponse(page, 'POST', '/auth/logout');
    await logoutItem.click();
    const logoutDialog = page
      .getByRole('dialog')
      .filter({ hasText: '是否退出登录？' })
      .last();
    await expect(logoutDialog).toBeVisible();
    await logoutDialog
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    const [closeSseResponse, logoutResponse] = await Promise.all([
      closeSsePromise,
      logoutPromise,
    ]);
    currentAccessToken = '';
    await expectSuccessEnvelope(
      closeSseResponse,
      'close SSE before social login',
    );
    await expectSuccessEnvelope(logoutResponse, 'logout before social login');
    await expect(page).toHaveURL(/\/auth\/login(?:[/?#]|$)/);

    const giteeOAuth = page.locator('[class*="simple-icons--gitee"]').first();
    await expect(giteeOAuth, 'Gitee OAuth login control').toBeVisible();
    await giteeOAuth.hover();
    await expect(page.getByText('Gitee登录', { exact: true })).toBeVisible();
    const socialBindingContract = await expectSuccessEnvelope<string>(
      await request.get(`${apiURL}/auth/binding/gitee`),
      'verify Gitee social login binding contract',
    );
    const socialContractAuthorizeUrl = new URL(socialBindingContract.data);
    expect(socialContractAuthorizeUrl.pathname).toBe('/social-callback');
    expect(socialContractAuthorizeUrl.searchParams.get('source')).toBe('gitee');
    expect(socialContractAuthorizeUrl.searchParams.get('code')).toBe(
      'http-contract-code',
    );
    expect(socialContractAuthorizeUrl.searchParams.get('state')).toBeTruthy();
    const socialBindingPromise = waitForApiResponse(
      page,
      'GET',
      '/auth/binding/gitee',
    );
    const socialCallbackNavigationPromise = page.waitForRequest((request) => {
      if (!request.isNavigationRequest()) return false;
      const url = new URL(request.url());
      return (
        url.pathname === '/social-callback' &&
        url.searchParams.get('source') === 'gitee'
      );
    });
    const socialLoginPromise = waitForApiResponse(page, 'POST', '/auth/login');
    await giteeOAuth.click();
    await expectJsonTransportResponse(
      await socialBindingPromise,
      'start Gitee social login',
    );
    const socialAuthorizeUrl = new URL(
      (await socialCallbackNavigationPromise).url(),
    );
    expect(socialAuthorizeUrl.pathname).toBe('/social-callback');
    expect(socialAuthorizeUrl.searchParams.get('source')).toBe('gitee');
    expect(socialAuthorizeUrl.searchParams.get('code')).toBe(
      'http-contract-code',
    );
    expect(socialAuthorizeUrl.searchParams.get('state')).toBeTruthy();
    expect(socialAuthorizeUrl.searchParams.get('state')).not.toBe(
      authorizeUrl.searchParams.get('state'),
    );
    expect(socialAuthorizeUrl.searchParams.get('state')).not.toBe(
      socialContractAuthorizeUrl.searchParams.get('state'),
    );
    await expect(page).toHaveURL(/\/social-callback\?.*source=gitee/);
    const socialLogin = await expectSuccessEnvelope<SocialLoginData>(
      await socialLoginPromise,
      'login through the bound Gitee account',
    );
    expect(socialLogin.data.access_token).toBeTruthy();
    currentAccessToken = socialLogin.data.access_token;
    currentClientId = socialLogin.data.client_id;
    await expect(page).not.toHaveURL(/\/social-callback(?:[/?#]|$)/, {
      timeout: 30_000,
    });
    await expect(
      page.locator('header .ant-avatar').last(),
      'header user avatar after social login',
    ).toBeVisible();

    const sociallyAuthenticatedListPromise = waitForApiResponse(
      page,
      'GET',
      '/system/social/list',
    );
    const sociallyAuthenticatedProfile = await openProfileFromUserMenu(page);
    expect(sociallyAuthenticatedProfile.data.user.userId).toBe(
      profile.data.user.userId,
    );
    await page.getByRole('tab', { name: '账号绑定' }).click();
    const sociallyAuthenticatedList = await expectSuccessEnvelope<SocialData[]>(
      await sociallyAuthenticatedListPromise,
      'load bound accounts after Gitee social login',
    );
    const sociallyAuthenticatedGitee = sociallyAuthenticatedList.data.find(
      (social) => social.source.toLowerCase() === 'gitee',
    );
    expect(sociallyAuthenticatedGitee?.id).toBe(gitee.id);
    if (!sociallyAuthenticatedGitee) {
      throw new Error('Gitee binding is missing after social login');
    }
    const sociallyAuthenticatedGiteeCard = giteeBindingCard(page);
    await expect(sociallyAuthenticatedGiteeCard).toContainText(
      '已绑定: HTTP Contract Social',
    );

    const unlockPromise = waitForApiResponse(
      page,
      'DELETE',
      `/auth/unlock/${sociallyAuthenticatedGitee.id}`,
    );
    const unboundSocialListPromise = waitForApiResponse(
      page,
      'GET',
      '/system/social/list',
    );
    await sociallyAuthenticatedGiteeCard
      .getByRole('button', { exact: true, name: '取消绑定' })
      .click();
    const unbindDialog = page
      .getByRole('dialog')
      .filter({ hasText: '确定解绑[gitee]平台' })
      .last();
    await expect(unbindDialog).toBeVisible();
    await unbindDialog
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(await unlockPromise, 'unbind Gitee account');
    const unboundSocialList = await expectSuccessEnvelope<SocialData[]>(
      await unboundSocialListPromise,
      'reload social accounts after unbinding',
    );
    expect(
      unboundSocialList.data.some(
        (social) => social.source.toLowerCase() === 'gitee',
      ),
    ).toBe(false);
    await expect(giteeBindingCard(page)).toContainText('绑定Gitee账号');

    await page.reload({ waitUntil: 'domcontentloaded' });
    const persistedUnboundListPromise = waitForApiResponse(
      page,
      'GET',
      '/system/social/list',
    );
    await page.getByRole('tab', { name: '账号绑定' }).click();
    const persistedUnboundList = await expectSuccessEnvelope<SocialData[]>(
      await persistedUnboundListPromise,
      'reload unbound social accounts after refresh',
    );
    expect(
      persistedUnboundList.data.some(
        (social) => social.source.toLowerCase() === 'gitee',
      ),
    ).toBe(false);
    await expect(giteeBindingCard(page)).toContainText('绑定Gitee账号');

    const onlineDevicesPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/online',
    );
    await page.getByRole('tab', { name: '在线设备' }).click();
    const onlineDevices = await expectPageEnvelope<{
      tokenId: string;
      userName: string;
    }>(await onlineDevicesPromise, 'load profile online devices');
    expect(onlineDevices.data.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tokenId: currentAccessToken,
          userName: expect.any(String),
        }),
      ]),
    );
    await expect(page.getByText('我的在线设备', { exact: true })).toBeVisible();
    await page.getByRole('tab', { name: '基本设置' }).click();

    const nickInput = formItem(page, '昵称').locator('input').first();
    const updatedNick = `${originalNick}-E2E`;
    await nickInput.fill(updatedNick);
    const updatePromise = waitForApiResponse(
      page,
      'PUT',
      '/system/user/profile',
    );
    await page.getByRole('button', { name: '更新信息' }).click();
    await expectSuccessEnvelope(await updatePromise, 'update profile details');

    const reloadProfilePromise = waitForApiResponse(
      page,
      'GET',
      '/system/user/profile',
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expectSuccessEnvelope(
      await reloadProfilePromise,
      'reload updated profile',
    );
    await expect(formItem(page, '昵称').locator('input').first()).toHaveValue(
      updatedNick,
    );

    await formItem(page, '昵称').locator('input').first().fill(originalNick);
    const restorePromise = waitForApiResponse(
      page,
      'PUT',
      '/system/user/profile',
    );
    await page.getByRole('button', { name: '更新信息' }).click();
    await expectSuccessEnvelope(
      await restorePromise,
      'restore profile details',
    );

    await page.locator('img[alt="avatar"]').locator('xpath=..').click();
    const avatarDialog = page.getByRole('dialog').last();
    await expect(
      avatarDialog.getByText('头像上传', { exact: true }),
    ).toBeVisible();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAGUlEQVR42mNkYGD4z0ABYBxVSFUBAAcRAQFP6E7AAAAAAElFTkSuQmCC',
      'base64',
    );
    await avatarDialog.locator('input[type="file"]').setInputFiles({
      buffer: png,
      mimeType: 'image/png',
      name: 'e2e-avatar.png',
    });
    const confirm = avatarDialog.getByRole('button', { name: '确认并上传' });
    await expect(confirm).toBeEnabled({ timeout: 15_000 });
    const uploadPromise = waitForApiResponse(
      page,
      'POST',
      '/resource/oss/upload',
    );
    const avatarUpdatePromise = waitForApiResponse(
      page,
      'PUT',
      '/system/user/profile',
    );
    await confirm.click();
    const uploadEnvelope = await expectSuccessEnvelope<{ ossId: string }>(
      await uploadPromise,
      'upload profile avatar',
    );
    uploadedOssId = uploadEnvelope.data.ossId;
    await expectSuccessEnvelope(
      await avatarUpdatePromise,
      'save profile avatar',
    );
    await expect(avatarDialog).toBeHidden();
  } finally {
    if (apiURL) {
      if (!currentAccessToken) {
        const fallbackLogin = await loginThroughUi(page);
        currentAccessToken = fallbackLogin.envelope.data.access_token;
        currentClientId = fallbackLogin.envelope.data.client_id;
      }
      const headers = {
        Authorization: `Bearer ${currentAccessToken}`,
        ClientID: currentClientId,
      };
      const boundAccounts = await expectSuccessEnvelope<SocialData[]>(
        await request.get(`${apiURL}/system/social/list`, { headers }),
        'load social accounts during cleanup',
      );
      for (const social of boundAccounts.data.filter(
        (item) => item.source.toLowerCase() === 'gitee',
      )) {
        await expectSuccessEnvelope(
          await request.delete(`${apiURL}/auth/unlock/${social.id}`, {
            headers,
          }),
          'unbind Gitee account during cleanup',
        );
      }
      await expectSuccessEnvelope(
        await request.put(`${apiURL}/system/user/profile`, {
          data: {
            avatar: originalAvatar,
            email: profile.data.user.email,
            nickName: originalNick,
            phoneNumber: profile.data.user.phoneNumber,
            sex: profile.data.user.sex,
            userId: profile.data.user.userId,
          },
          headers,
        }),
        'restore profile during cleanup',
      );
      if (uploadedOssId) {
        await expectSuccessEnvelope(
          await request.delete(`${apiURL}/resource/oss/${uploadedOssId}`, {
            headers,
          }),
          'delete profile avatar during cleanup',
        );
      }
    }
  }
});

test('a user removes another online device from the profile page', async ({
  authenticatedSession,
  browser,
  request,
}) => {
  test.setTimeout(120_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };
  let secondContext: BrowserContext | undefined;
  let secondToken: string | undefined;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await page.waitForTimeout(1100);
    secondContext = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:15555',
    });
    const secondPage = await secondContext.newPage();
    const secondIssues = recordBrowserIssues(secondPage);
    const secondLogin = await loginThroughUi(secondPage);
    secondToken = secondLogin.envelope.data.access_token;

    await openProfileFromUserMenu(page);
    const onlineDevicesPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/online',
    );
    await page.getByRole('tab', { name: '在线设备' }).click();
    const devices = await expectPageEnvelope<{
      loginTime: number;
      tokenId: string;
    }>(await onlineDevicesPromise, 'load profile online devices for removal');
    const target = devices.data.rows.find((row) => row.tokenId === secondToken);
    expect(
      target,
      'second browser must appear in profile devices',
    ).toBeTruthy();
    if (!target) throw new Error('second browser profile device is missing');

    const row = page
      .locator('.vxe-body--row')
      .filter({ hasText: formatDateTime(target.loginTime) })
      .first();
    await expect(row, 'second profile device row').toBeVisible();
    const fixedRow = await actionRow(row);
    const forcePromise = waitForApiResponse(
      page,
      'DELETE',
      `/monitor/online/myself/${target.tokenId}`,
    );
    const reloadPromise = waitForApiResponse(page, 'GET', '/monitor/online');
    await fixedRow.getByRole('button', { name: '强制下线' }).click();
    const popconfirm = page.locator('.ant-popover:visible').last();
    await popconfirm
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(await forcePromise, 'remove profile device');
    const reloaded = await expectPageEnvelope<{ tokenId: string }>(
      await reloadPromise,
      'reload profile devices after removal',
    );
    expect(reloaded.data.rows).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tokenId: target.tokenId }),
      ]),
    );
    secondToken = undefined;

    await secondPage.reload({ waitUntil: 'domcontentloaded' });
    await expect(secondPage).toHaveURL(/\/auth\/login(?:[/?#]|$)/, {
      timeout: 30_000,
    });
    expect(
      secondIssues.some((issue) =>
        issue.includes('status of 401 (Unauthorized)'),
      ),
      'the forced-offline browser must observe an unauthorized response',
    ).toBe(true);
    expect(
      secondIssues.some((issue) =>
        issue.includes('登录认证过期，请重新登录后继续。'),
      ),
      'the forced-offline browser must report the expired session',
    ).toBe(true);
    expect(
      secondIssues.filter(
        (issue) =>
          !issue.includes('status of 401 (Unauthorized)') &&
          !issue.includes('登录认证过期，请重新登录后继续。'),
      ),
      'second profile browser must have no unexpected diagnostics',
    ).toEqual([]);
  } finally {
    await secondContext?.close();
    if (apiURL && secondToken) {
      await expectSuccessEnvelope(
        await request.delete(`${apiURL}/monitor/online/${secondToken}`, {
          headers,
        }),
        'remove profile device during cleanup',
      );
    }
  }
});

async function changePassword(
  page: Page,
  oldPassword: string,
  newPassword: string,
  onPasswordChanged: () => void,
) {
  await page.getByRole('tab', { name: '安全设置' }).click();
  await fillLabeledInput(page, '旧密码', oldPassword);
  await fillLabeledInput(page, '新密码', newPassword);
  await fillLabeledInput(page, '确认密码', newPassword);
  const responsePromise = waitForApiResponse(
    page,
    'PUT',
    '/system/user/profile/updatePwd',
  );
  await page.getByRole('button', { name: '修改密码' }).click();
  const confirmDialog = page.getByRole('dialog').last();
  await expect(confirmDialog).toContainText('确认修改密码吗？');
  await confirmDialog
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();
  await expectSuccessEnvelope(await responsePromise, 'update password');
  onPasswordChanged();
  await expect(page).toHaveURL(/\/auth\/login(?:[/?#]|$)/, {
    timeout: 30_000,
  });
}

test('password change uses encrypted requests and both passwords are verified on the real login page', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(180_000);
  const originalPassword = process.env.E2E_PASSWORD ?? 'admin123';
  const temporaryPassword = `Tmp${Date.now().toString(36)}!`;
  const username = process.env.E2E_USERNAME ?? 'admin';
  let passwordIsTemporary = false;

  try {
    await openProfileFromUserMenu(page);
    await changePassword(page, originalPassword, temporaryPassword, () => {
      passwordIsTemporary = true;
    });
    await loginThroughUi(page, { password: temporaryPassword, username });
    await openProfileFromUserMenu(page);
    await changePassword(page, temporaryPassword, originalPassword, () => {
      passwordIsTemporary = false;
    });
    await loginThroughUi(page, { password: originalPassword, username });
    await expect(page).not.toHaveURL(/\/auth(?:\/|$)/);
  } finally {
    if (passwordIsTemporary) {
      await page.evaluate(() => window.localStorage.clear());
      await page.context().clearCookies();
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await loginThroughUi(page, { password: temporaryPassword, username });
      await openProfileFromUserMenu(page);
      await changePassword(page, temporaryPassword, originalPassword, () => {
        passwordIsTemporary = false;
      });
      await loginThroughUi(page, { password: originalPassword, username });
    }
  }
});
