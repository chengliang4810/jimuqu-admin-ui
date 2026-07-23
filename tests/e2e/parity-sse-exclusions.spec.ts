import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import {
  antButtonNames,
  confirmRowDelete,
  dataRow,
  openCreateOverlay,
  submitOverlay,
} from './helpers/crud';
import { fillLabeledInput, formItem } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

test('the authenticated browser exchanges WebSocket heartbeat and messages', async ({
  authenticatedSession,
}) => {
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  if (!apiURL) {
    throw new Error('PLAYWRIGHT_API_URL must be configured');
  }
  const socketURL = `${apiURL.replace(/^http/, 'ws')}/resource/websocket?clientid=${encodeURIComponent(loginEnvelope.data.client_id)}&Authorization=${encodeURIComponent(`Bearer ${accessToken}`)}`;
  const payload = `browser-websocket-${Date.now().toString(36)}`;

  const result = await page.evaluate(
    ({ payload, socketURL }) =>
      new Promise<{ echo: string; pong: string }>((resolve, reject) => {
        const socket = new WebSocket(socketURL);
        const timeout = window.setTimeout(() => {
          socket.close();
          reject(new Error('WebSocket browser exchange timed out'));
        }, 15_000);
        let pong = '';

        socket.addEventListener('open', () => {
          socket.send(JSON.stringify({ type: 'ping' }));
        });
        socket.addEventListener('message', (event) => {
          const text = String(event.data);
          if (text === '{"type":"pong"}') {
            pong = text;
            socket.send(payload);
            return;
          }
          try {
            const message = JSON.parse(text) as {
              message?: string;
              source?: string;
              type?: string;
            };
            if (
              message.message === payload &&
              message.source === 'client' &&
              message.type === 'custom'
            ) {
              window.clearTimeout(timeout);
              socket.close(1000, 'done');
              resolve({ echo: text, pong });
            }
          } catch {
            // Ignore unrelated non-JSON frames while waiting for the echo.
          }
        });
        socket.addEventListener('error', () => {
          window.clearTimeout(timeout);
          reject(new Error('WebSocket browser connection failed'));
        });
      }),
    { payload, socketURL },
  );

  expect(result.pong).toBe('{"type":"pong"}');
  expect(JSON.parse(result.echo)).toEqual(
    expect.objectContaining({
      message: payload,
      source: 'client',
      type: 'custom',
    }),
  );
});

test('publishing a notice produces a real SSE notification in the web UI', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(120_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const title = `E2E SSE ${Date.now().toString(36)}`;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  let noticeId: string | undefined;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();

  try {
    await openDynamicModule(page, {
      heading: '通知公告列表',
      item: '通知公告',
      parent: '系统管理',
      responseKind: 'page',
      responsePath: '/system/notice/list',
      url: /\/system\/notice(?:[/?#]|$)/,
    });

    const createOverlay = await openCreateOverlay(page);
    await fillLabeledInput(createOverlay, '公告标题', title);
    const editor = createOverlay.locator('[contenteditable="true"]').first();
    await expect(editor, 'notice editor').toBeVisible();
    await editor.fill(`SSE 通知内容 ${title}`);
    const createPromise = waitForApiResponse(page, 'POST', '/system/notice');
    const reloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/notice/list',
    );
    await submitOverlay(createOverlay);
    await expectSuccessEnvelope(await createPromise, 'publish SSE notice');
    await expectPageEnvelope(
      await reloadPromise,
      'reload published SSE notice',
    );

    const notification = page
      .locator('.ant-notification-notice')
      .filter({ hasText: title })
      .last();
    await expect(notification, 'SSE notice notification').toBeVisible({
      timeout: 20_000,
    });
    await expect(notification).toContainText('收到新消息');

    await page.locator('header .bell-button').click();
    const notificationPopover = page.locator('.ant-popover:visible').last();
    await expect(notificationPopover).toBeVisible();
    await notificationPopover
      .locator('.ant-segmented-item-label')
      .filter({ hasText: /^通知(?:\(\d+\))?$/ })
      .click();
    const notificationItem = notificationPopover
      .locator('li')
      .filter({ hasText: title })
      .first();
    await expect(
      notificationItem,
      'SSE notice in notification center',
    ).toBeVisible();
    await notificationItem.click();
    const previewDialog = page.getByRole('dialog').last();
    await expect(
      previewDialog.getByText('通知公告', { exact: true }).first(),
    ).toBeVisible();
    await expect(previewDialog).toContainText(title);
    await expect(previewDialog).toContainText(`SSE 通知内容 ${title}`);
    await previewDialog.locator('.ant-modal-close').click();
    await expect(previewDialog).toBeHidden();
    await page.locator('header .bell-button').click();
    await expect(notificationPopover).toBeHidden();

    await fillLabeledInput(page, '公告标题', title);
    const searchPromise = waitForApiResponse(
      page,
      'GET',
      '/system/notice/list',
    );
    await page.getByRole('button', { name: antButtonNames.search }).click();
    const searchEnvelope = await expectPageEnvelope<{
      noticeId: string;
      noticeTitle: string;
    }>(await searchPromise, 'search SSE notice');
    noticeId = searchEnvelope.data.rows.find(
      (row) => row.noticeTitle === title,
    )?.noticeId;
    expect(noticeId, 'created SSE notice id').toBeTruthy();
    const deletePromise = waitForApiResponse(
      page,
      'DELETE',
      /\/system\/notice\/[^/]+$/,
    );
    const deleteReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/system/notice/list',
    );
    await confirmRowDelete(dataRow(page, title), '确认删除？');
    await expectSuccessEnvelope(await deletePromise, 'delete SSE notice');
    noticeId = undefined;
    await expectPageEnvelope(
      await deleteReloadPromise,
      'reload deleted SSE notice',
    );
  } finally {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ClientID: loginEnvelope.data.client_id,
    };
    if (apiURL && !noticeId) {
      const response = await request.get(`${apiURL}/system/notice/list`, {
        headers,
        params: { noticeTitle: title, pageNum: 1, pageSize: 10 },
      });
      const envelope = await expectPageEnvelope<{
        noticeId: string;
        noticeTitle: string;
      }>(response, 'find SSE notice during cleanup');
      noticeId = envelope.data.rows.find(
        (row) => row.noticeTitle === title,
      )?.noticeId;
    }
    if (apiURL && noticeId) {
      await expectSuccessEnvelope(
        await request.delete(`${apiURL}/system/notice/${noticeId}`, {
          headers,
        }),
        'delete SSE notice during cleanup',
      );
    }
  }
});

test('excluded modules have no menu, page or matching API request', async ({
  authenticatedPage: page,
}) => {
  test.setTimeout(120_000);
  const excludedMenuItems = [
    'AI模块',
    '代码生成',
    '工作流',
    '演示模块',
    '任务调度',
    '监控管理',
    'SnailJob',
    'SnailAI',
  ];
  const menuText = await page.locator('.ant-menu').allTextContents();
  for (const item of excludedMenuItems) {
    expect(
      menuText.join('\n'),
      `${item} must not exist in dynamic menus`,
    ).not.toContain(item);
  }

  await openDynamicModule(page, {
    ancestor: '系统管理',
    heading: '操作日志列表',
    item: '操作日志',
    parent: '日志管理',
    responseKind: 'page',
    responsePath: '/monitor/operlog/list',
    url: /\/system\/log\/operlog(?:[/?#]|$)/,
  });
  await formItem(page, '操作类型').getByRole('combobox').click();
  const operationTypeDropdown = page.locator('.ant-select-dropdown:visible');
  await expect(operationTypeDropdown).toBeVisible();
  await expect(
    operationTypeDropdown,
    'excluded code-generation operation type must not be visible',
  ).not.toContainText('生成代码');
  await page.keyboard.press('Escape');

  // `/job` is the removed persistent scheduler. Solon runtime jobs live at
  // `/monitor/job` and must remain available.
  const excludedLegacyPaths = [
    '/ai',
    '/job',
    '/workflow',
    '/tool/gen',
    '/demo',
    '/extend',
    '/monitor/admin',
    '/monitor/snailjob',
    '/monitor/snailai',
  ];
  const forbiddenRequests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'document') {
      return;
    }
    const pathname = new URL(request.url()).pathname.toLowerCase();
    const apiPath = pathname.replace(/^\/(?:dev|prod)-api(?=\/)/, '');
    if (
      excludedLegacyPaths.some(
        (path) => apiPath === path || apiPath.startsWith(`${path}/`),
      )
    ) {
      forbiddenRequests.push(`${request.method()} ${pathname}`);
    }
  });

  for (const path of excludedLegacyPaths) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(
      new RegExp(`${path.replace('/', '\\/')}(?:[/?#]|$)`),
    );
    await expect(
      page.getByText('哎呀！未找到页面', { exact: true }),
    ).toBeVisible();
  }

  expect(
    forbiddenRequests,
    'excluded modules must not issue API requests',
  ).toEqual([]);
});
