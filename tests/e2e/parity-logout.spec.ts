import { expect, test } from './fixtures';
import { expectSuccessEnvelope, waitForApiResponse } from './helpers/api';
import { antButtonNames } from './helpers/crud';

test('logout closes SSE and ends the authenticated session from the user menu', async ({
  authenticatedPage: page,
}) => {
  const avatar = page.locator('header .ant-avatar').last();
  await expect(avatar, 'header user avatar').toBeVisible();
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

  const confirmDialog = page
    .getByRole('dialog')
    .filter({ hasText: '是否退出登录？' })
    .last();
  await expect(confirmDialog).toBeVisible();
  await confirmDialog
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();

  await expectSuccessEnvelope(await closeSsePromise, 'close SSE on logout');
  await expectSuccessEnvelope(await logoutPromise, 'logout');
  await expect(page).toHaveURL(/\/auth\/login(?:[/?#]|$)/);
});
