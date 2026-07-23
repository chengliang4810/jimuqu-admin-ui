import type { Locator, Page, Response } from 'playwright/test';

import type { ApiEnvelope } from './helpers/api';

import { expect, test } from './fixtures';
import {
  expectPageEnvelope,
  expectSuccessEnvelope,
  waitForApiResponse,
} from './helpers/api';
import { actionRow, antButtonNames, dataRow } from './helpers/crud';
import { fillLabeledInput, selectOption } from './helpers/form';
import { openDynamicModule } from './helpers/navigation';

interface ScheduledJob {
  description: string;
  enabled: boolean;
  jobName: string;
  maxRetries: number;
  retryIntervalMs: number;
  scheduleExpression: string;
  scheduleType: string;
}

interface JobExecutionLog {
  attempt: number;
  durationMs: number;
  errorSummary?: string;
  instanceId: string;
  jobName: string;
  logId: number | string;
  startTime: string;
  status: string;
  triggerType: string;
}

const cleanupJobName = 'scheduledJobLogCleanup';
const retrySuccessJobName = 'fullStackRetrySuccessJob';
const alwaysFailJobName = 'fullStackAlwaysFailJob';
const slowJobName = 'fullStackSlowJob';

async function selectToolbarOption(
  page: Page,
  scope: Locator,
  placeholder: string,
  optionText: string,
) {
  const selector = scope
    .locator('.ant-select', { hasText: placeholder })
    .first();
  await expect(selector, `${placeholder} select`).toBeVisible();
  await selector.click();
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(dropdown).toBeVisible();
  await dropdown
    .locator('.ant-select-item-option:not(.ant-select-item-option-disabled)')
    .filter({ hasText: optionText })
    .first()
    .click();
}

async function updateRetryConfigThroughUi(
  page: Page,
  jobName: string,
  maxRetries: number,
  retryIntervalMs: number,
) {
  const row = await actionRow(dataRow(page, jobName));
  await row.getByRole('button', { exact: true, name: '重试设置' }).click();
  const dialog = page
    .getByRole('dialog')
    .filter({ hasText: `重试设置 - ${jobName}` })
    .last();
  await expect(dialog).toBeVisible();
  await fillLabeledInput(dialog, '最大重试次数', String(maxRetries));
  await fillLabeledInput(dialog, '重试间隔 (ms)', String(retryIntervalMs));
  const updatePromise = waitForApiResponse(
    page,
    'PUT',
    `/monitor/job/${jobName}/config`,
  );
  const reloadPromise = waitForApiResponse(page, 'GET', '/monitor/job/list');
  await dialog
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();
  await expectSuccessEnvelope(await updatePromise, `update ${jobName} config`);
  await expectSuccessEnvelope<ScheduledJob[]>(
    await reloadPromise,
    `reload ${jobName} config`,
  );
  await expect(dialog).toBeHidden();
}

async function startJobThroughUi(page: Page, jobName: string) {
  const requestPromise = page.waitForRequest((request) => {
    const { pathname } = new URL(request.url());
    return (
      request.method() === 'POST' &&
      pathname.endsWith(`/monitor/job/${jobName}/run`)
    );
  });
  const row = await actionRow(dataRow(page, jobName));
  await row.getByRole('button', { exact: true, name: '立即执行' }).click();
  const confirmation = page
    .locator('.ant-popover:visible')
    .filter({ hasText: `确认立即执行任务[${jobName}]？` })
    .last();
  await expect(confirmation).toBeVisible();
  await confirmation
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();
  return requestPromise;
}

async function requireResponse(
  responsePromise: Promise<null | Response>,
  operation: string,
) {
  const response = await responsePromise;
  expect(response, `${operation} response`).not.toBeNull();
  return response as Response;
}

async function openJobLogDrawer(page: Page, jobName: string) {
  const responsePromise = waitForApiResponse(
    page,
    'GET',
    '/monitor/job/log/list',
  );
  const row = await actionRow(dataRow(page, jobName));
  await row.getByRole('button', { exact: true, name: '执行记录' }).click();
  const envelope = await expectPageEnvelope<JobExecutionLog>(
    await responsePromise,
    `load ${jobName} logs`,
  );
  const drawer = page
    .getByRole('dialog')
    .filter({ hasText: `执行记录 - ${jobName}` })
    .last();
  await expect(drawer).toBeVisible();
  return { drawer, envelope };
}

async function closeJobLogDrawer(drawer: Locator) {
  await drawer.getByRole('button', { exact: true, name: 'close' }).click();
  await expect(drawer).toBeHidden();
}

async function closeVisibleJobLogDrawer(page: Page) {
  const drawer = page
    .getByRole('dialog')
    .filter({ hasText: '执行记录 - ' })
    .last();
  if (!(await drawer.isVisible())) {
    return;
  }
  const closeButton = drawer.getByRole('button', {
    exact: true,
    name: 'close',
  });
  if (!(await closeButton.isVisible())) {
    await expect(drawer).toBeHidden();
    return;
  }
  await closeJobLogDrawer(drawer);
}

async function assertNewJobLogStatus(
  page: Page,
  jobName: string,
  oldLogIds: Set<string>,
  statusOption: string,
  status: string,
  attempt: number,
) {
  await expect(async () => {
    const { drawer } = await openJobLogDrawer(page, jobName);
    try {
      const responsePromise = waitForApiResponse(
        page,
        'GET',
        '/monitor/job/log/list',
      );
      await selectToolbarOption(page, drawer, '执行状态', statusOption);
      const response = await responsePromise;
      const envelope = await expectPageEnvelope<JobExecutionLog>(
        response,
        `filter ${jobName} ${status} logs`,
      );
      expect(new URL(response.url()).searchParams.get('status')).toBe(status);
      const log = envelope.data.rows.find(
        (row) =>
          row.jobName === jobName &&
          row.status === status &&
          row.attempt === attempt &&
          !oldLogIds.has(String(row.logId)),
      );
      expect(log, `new ${jobName} ${status} log`).toBeTruthy();
      if (!log) {
        throw new Error(`${jobName} ${status} log is missing`);
      }
      const logRow = drawer
        .locator('.vxe-body--row')
        .filter({ hasText: String(log.logId) })
        .first();
      await expect(logRow).toContainText(statusOption);
      await expect(logRow).toContainText('手动执行');
      await expect(logRow).toContainText(String(attempt));
      if (status === 'FAILED' || status === 'RETRY') {
        await expect(logRow).toContainText('IllegalStateException');
      }
    } finally {
      await closeJobLogDrawer(drawer);
    }
  }).toPass({ intervals: [100, 250, 500, 1000], timeout: 15_000 });
}

async function removeNewJobLogsThroughUi(
  page: Page,
  jobName: string,
  oldLogIds: Set<string>,
) {
  const { drawer, envelope } = await openJobLogDrawer(page, jobName);
  const newLogs = envelope.data.rows.filter(
    (row) => !oldLogIds.has(String(row.logId)),
  );
  if (newLogs.length === 0) {
    await closeJobLogDrawer(drawer);
    return;
  }
  for (const log of newLogs) {
    await drawer
      .locator('.vxe-body--row')
      .filter({ hasText: String(log.logId) })
      .first()
      .locator('.vxe-cell--checkbox')
      .click();
  }
  const deletePromise = waitForApiResponse(
    page,
    'DELETE',
    `/monitor/job/log/${newLogs.map((row) => row.logId).join(',')}`,
  );
  const reloadPromise = waitForApiResponse(
    page,
    'GET',
    '/monitor/job/log/list',
  );
  await drawer.getByRole('button', { name: antButtonNames.delete }).click();
  const confirmation = page
    .getByRole('dialog')
    .filter({ hasText: `确认删除选中的${newLogs.length}条执行记录吗？` })
    .last();
  await confirmation
    .getByRole('button', { name: antButtonNames.confirmAction })
    .click();
  await expectSuccessEnvelope(await deletePromise, `delete ${jobName} logs`);
  await expectPageEnvelope<JobExecutionLog>(
    await reloadPromise,
    `reload ${jobName} logs after delete`,
  );
  await closeJobLogDrawer(drawer);
}

function requireOldLogIds(
  oldLogIds: Map<string, Set<string>>,
  jobName: string,
) {
  const ids = oldLogIds.get(jobName);
  expect(ids, `${jobName} initial log snapshot`).toBeTruthy();
  if (!ids) {
    throw new Error(`${jobName} initial log snapshot is missing`);
  }
  return ids;
}

test('failed, retry and skipped executions are visible and filterable through the UI', async ({
  authenticatedSession,
}) => {
  test.setTimeout(180_000);
  const { page } = authenticatedSession;
  const jobNames = [
    retrySuccessJobName,
    alwaysFailJobName,
    slowJobName,
  ] as const;
  const listEnvelope = (await openDynamicModule(page, {
    heading: '定时任务列表',
    item: '定时任务',
    parent: '系统监控',
    responseKind: 'list',
    responsePath: '/monitor/job/list',
    url: /\/monitor\/job(?:[/?#]|$)/,
  })) as ApiEnvelope<ScheduledJob[]>;
  const jobs = new Map(
    listEnvelope.data
      .filter((job) =>
        jobNames.includes(job.jobName as (typeof jobNames)[number]),
      )
      .map((job) => [job.jobName, job]),
  );
  expect([...jobs.keys()].sort(), 'full-stack scheduled job probes').toEqual(
    [...jobNames].sort(),
  );

  const oldLogIds = new Map<string, Set<string>>();
  for (const jobName of jobNames) {
    const { drawer, envelope } = await openJobLogDrawer(page, jobName);
    oldLogIds.set(
      jobName,
      new Set(envelope.data.rows.map((row) => String(row.logId))),
    );
    await closeJobLogDrawer(drawer);
  }

  const configuredJobs = new Set<string>();
  try {
    for (const jobName of jobNames) {
      await updateRetryConfigThroughUi(
        page,
        jobName,
        jobName === slowJobName ? 0 : 1,
        25,
      );
      configuredJobs.add(jobName);
    }

    const retryRequest = await startJobThroughUi(page, retrySuccessJobName);
    await expectSuccessEnvelope(
      await requireResponse(retryRequest.response(), 'run retry-success probe'),
      'run retry-success probe',
    );

    const failedRequest = await startJobThroughUi(page, alwaysFailJobName);
    await expectSuccessEnvelope(
      await requireResponse(failedRequest.response(), 'submit failing probe'),
      'run failing probe',
    );

    const slowRequest = await startJobThroughUi(page, slowJobName);
    const skippedRequest = await startJobThroughUi(page, slowJobName);
    await expectSuccessEnvelope(
      await requireResponse(
        skippedRequest.response(),
        'run contended slow probe',
      ),
      'run contended slow probe',
    );
    await expectSuccessEnvelope(
      await requireResponse(slowRequest.response(), 'run slow probe'),
      'run slow probe',
    );

    await assertNewJobLogStatus(
      page,
      retrySuccessJobName,
      requireOldLogIds(oldLogIds, retrySuccessJobName),
      '重试',
      'RETRY',
      1,
    );
    await assertNewJobLogStatus(
      page,
      retrySuccessJobName,
      requireOldLogIds(oldLogIds, retrySuccessJobName),
      '成功',
      'SUCCESS',
      2,
    );
    await assertNewJobLogStatus(
      page,
      alwaysFailJobName,
      requireOldLogIds(oldLogIds, alwaysFailJobName),
      '重试',
      'RETRY',
      1,
    );
    await assertNewJobLogStatus(
      page,
      alwaysFailJobName,
      requireOldLogIds(oldLogIds, alwaysFailJobName),
      '失败',
      'FAILED',
      2,
    );
    await assertNewJobLogStatus(
      page,
      slowJobName,
      requireOldLogIds(oldLogIds, slowJobName),
      '跳过',
      'SKIPPED',
      1,
    );
    await assertNewJobLogStatus(
      page,
      slowJobName,
      requireOldLogIds(oldLogIds, slowJobName),
      '成功',
      'SUCCESS',
      1,
    );
  } finally {
    await closeVisibleJobLogDrawer(page);
    for (const jobName of configuredJobs) {
      const job = jobs.get(jobName);
      if (job) {
        await updateRetryConfigThroughUi(
          page,
          jobName,
          job.maxRetries,
          job.retryIntervalMs,
        );
      }
    }
    for (const jobName of jobNames) {
      await removeNewJobLogsThroughUi(
        page,
        jobName,
        requireOldLogIds(oldLogIds, jobName),
      );
    }
  }
});

test('Solon runtime job config, manual run and execution log work through the UI', async ({
  authenticatedSession,
  request,
}) => {
  test.setTimeout(120_000);
  const { accessToken, loginEnvelope, page } = authenticatedSession;
  const apiURL = process.env.PLAYWRIGHT_API_URL;
  expect(apiURL, 'PLAYWRIGHT_API_URL must be configured').toBeTruthy();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    ClientID: loginEnvelope.data.client_id,
  };

  const listEnvelope = (await openDynamicModule(page, {
    heading: '定时任务列表',
    item: '定时任务',
    parent: '系统监控',
    responseKind: 'list',
    responsePath: '/monitor/job/list',
    url: /\/monitor\/job(?:[/?#]|$)/,
  })) as ApiEnvelope<ScheduledJob[]>;
  const job = listEnvelope.data.find((item) => item.jobName === cleanupJobName);
  expect(job, `${cleanupJobName} runtime job`).toBeTruthy();
  if (!job || !apiURL) {
    throw new Error('runtime cleanup job is missing');
  }

  const searchForm = page.locator('form:visible').filter({
    has: page.getByRole('textbox', { name: /任务名称/ }),
  });
  await expect(searchForm, 'runtime job search form').toHaveCount(1);
  const searchButton = searchForm.getByRole('button', {
    name: antButtonNames.search,
  });

  await fillLabeledInput(searchForm, '任务名称', cleanupJobName);
  let searchPromise = waitForApiResponse(page, 'GET', '/monitor/job/list');
  await searchButton.click();
  await expectSuccessEnvelope<ScheduledJob[]>(
    await searchPromise,
    'search runtime jobs by name',
  );
  await expect(dataRow(page, cleanupJobName)).toBeVisible();

  await selectOption(
    page,
    searchForm,
    '任务状态',
    job.enabled ? '已停止' : '运行中',
  );
  searchPromise = waitForApiResponse(page, 'GET', '/monitor/job/list');
  await searchButton.click();
  await expectSuccessEnvelope<ScheduledJob[]>(
    await searchPromise,
    'filter runtime jobs by status',
  );
  await expect(dataRow(page, cleanupJobName)).toHaveCount(0);

  const resetPromise = waitForApiResponse(page, 'GET', '/monitor/job/list');
  await searchForm.getByRole('button', { name: antButtonNames.reset }).click();
  await expectSuccessEnvelope<ScheduledJob[]>(
    await resetPromise,
    'reset runtime job filters',
  );
  await expect(dataRow(page, cleanupJobName)).toBeVisible();

  const nextConfig = {
    maxRetries: job.maxRetries === 0 ? 1 : job.maxRetries - 1,
    retryIntervalMs: job.retryIntervalMs + 100,
  };

  try {
    const targetEnabled = !job.enabled;
    const targetAction = targetEnabled ? 'start' : 'stop';
    const statusPromise = waitForApiResponse(
      page,
      'PUT',
      `/monitor/job/${cleanupJobName}/${targetAction}`,
    );
    const statusReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/job/list',
    );
    const initialSwitch = dataRow(page, cleanupJobName).getByRole('switch');
    await expect(initialSwitch).toHaveAttribute(
      'aria-checked',
      String(job.enabled),
    );
    await initialSwitch.click();
    await expectSuccessEnvelope(await statusPromise, 'change job status');
    await expectSuccessEnvelope<ScheduledJob[]>(
      await statusReloadPromise,
      'reload changed job status',
    );
    await expect(
      dataRow(page, cleanupJobName).getByRole('switch'),
    ).toHaveAttribute('aria-checked', String(targetEnabled));

    const restoreAction = job.enabled ? 'start' : 'stop';
    const restoreStatusPromise = waitForApiResponse(
      page,
      'PUT',
      `/monitor/job/${cleanupJobName}/${restoreAction}`,
    );
    const restoreStatusReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/job/list',
    );
    await dataRow(page, cleanupJobName).getByRole('switch').click();
    await expectSuccessEnvelope(
      await restoreStatusPromise,
      'restore job status through UI',
    );
    await expectSuccessEnvelope<ScheduledJob[]>(
      await restoreStatusReloadPromise,
      'reload restored job status',
    );
    await expect(
      dataRow(page, cleanupJobName).getByRole('switch'),
    ).toHaveAttribute('aria-checked', String(job.enabled));

    const jobRow = await actionRow(dataRow(page, cleanupJobName));
    await jobRow.getByRole('button', { exact: true, name: '重试设置' }).click();
    const configDialog = page
      .getByRole('dialog')
      .filter({ hasText: `重试设置 - ${cleanupJobName}` })
      .last();
    await expect(configDialog).toBeVisible();
    await fillLabeledInput(configDialog, '最大重试次数', '');
    await configDialog
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expect(configDialog.getByText('请输入最大重试次数')).toBeVisible();
    await expect(configDialog).toBeVisible();

    await fillLabeledInput(
      configDialog,
      '最大重试次数',
      String(nextConfig.maxRetries),
    );
    await fillLabeledInput(
      configDialog,
      '重试间隔 (ms)',
      String(nextConfig.retryIntervalMs),
    );
    const updatePromise = waitForApiResponse(
      page,
      'PUT',
      `/monitor/job/${cleanupJobName}/config`,
    );
    const configReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/job/list',
    );
    await configDialog
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(await updatePromise, 'update retry config');
    await expectSuccessEnvelope<ScheduledJob[]>(
      await configReloadPromise,
      'reload runtime jobs',
    );
    await expect(configDialog).toBeHidden();

    const existingManualLogs = await expectPageEnvelope<JobExecutionLog>(
      await request.get(`${apiURL}/monitor/job/log/list`, {
        headers,
        params: {
          jobName: cleanupJobName,
          pageNum: 1,
          pageSize: 100,
          triggerType: 'MANUAL',
        },
      }),
      'snapshot existing manual job logs',
    );
    const existingManualLogIds = new Set(
      existingManualLogs.data.rows.map((row) => String(row.logId)),
    );

    const refreshedRow = await actionRow(dataRow(page, cleanupJobName));
    const runPromise = waitForApiResponse(
      page,
      'POST',
      `/monitor/job/${cleanupJobName}/run`,
    );
    await refreshedRow
      .getByRole('button', { exact: true, name: '立即执行' })
      .click();
    const runConfirm = page
      .locator('.ant-popover:visible')
      .filter({ hasText: `确认立即执行任务[${cleanupJobName}]？` })
      .last();
    await expect(runConfirm).toBeVisible();
    await runConfirm
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(await runPromise, 'run runtime job');

    let manualLog: JobExecutionLog | undefined;
    await expect(async () => {
      const response = await request.get(`${apiURL}/monitor/job/log/list`, {
        headers,
        params: {
          jobName: cleanupJobName,
          pageNum: 1,
          pageSize: 20,
          status: 'SUCCESS',
          triggerType: 'MANUAL',
        },
      });
      const envelope = await expectPageEnvelope<JobExecutionLog>(
        response,
        'poll manual job log',
      );
      manualLog = envelope.data.rows.find(
        (row) =>
          row.jobName === cleanupJobName &&
          row.status === 'SUCCESS' &&
          row.triggerType === 'MANUAL' &&
          !existingManualLogIds.has(String(row.logId)),
      );
      expect(manualLog, 'new manual SUCCESS execution log').toBeTruthy();
    }).toPass({ intervals: [100, 250, 500], timeout: 10_000 });
    if (!manualLog) {
      throw new Error('manual SUCCESS execution log is missing');
    }

    const logPromise = waitForApiResponse(page, 'GET', '/monitor/job/log/list');
    const latestRow = await actionRow(dataRow(page, cleanupJobName));
    await latestRow
      .getByRole('button', { exact: true, name: '执行记录' })
      .click();
    const logEnvelope = await expectPageEnvelope<JobExecutionLog>(
      await logPromise,
      'load execution logs',
    );
    expect(logEnvelope.data.rows.length).toBeGreaterThan(0);

    const drawer = page
      .getByRole('dialog')
      .filter({ hasText: `执行记录 - ${cleanupJobName}` })
      .last();
    await expect(drawer).toBeVisible();

    let filterPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/job/log/list',
    );
    await selectToolbarOption(page, drawer, '执行状态', '成功');
    let filterResponse = await filterPromise;
    await expectPageEnvelope<JobExecutionLog>(
      filterResponse,
      'filter execution logs by status',
    );
    expect(new URL(filterResponse.url()).searchParams.get('status')).toBe(
      'SUCCESS',
    );

    filterPromise = waitForApiResponse(page, 'GET', '/monitor/job/log/list');
    await selectToolbarOption(page, drawer, '触发类型', '手动执行');
    filterResponse = await filterPromise;
    await expectPageEnvelope<JobExecutionLog>(
      filterResponse,
      'filter execution logs by trigger type',
    );
    const filterParameters = new URL(filterResponse.url()).searchParams;
    expect(filterParameters.get('status')).toBe('SUCCESS');
    expect(filterParameters.get('triggerType')).toBe('MANUAL');

    const logRow = drawer
      .locator('.vxe-body--row')
      .filter({ hasText: String(manualLog.logId) })
      .first();
    await expect(logRow).toContainText('成功');
    await expect(logRow).toContainText('手动执行');
    await expect(logRow).toContainText(String(manualLog.attempt));
    await expect(logRow).toContainText(manualLog.instanceId);
    await logRow.locator('.vxe-cell--checkbox').click();

    const deleteButton = drawer.getByRole('button', {
      name: antButtonNames.delete,
    });
    await expect(deleteButton).toBeEnabled();
    const deletePromise = waitForApiResponse(
      page,
      'DELETE',
      `/monitor/job/log/${manualLog.logId}`,
    );
    const deleteReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/job/log/list',
    );
    await deleteButton.click();
    const deleteConfirm = page
      .getByRole('dialog')
      .filter({ hasText: '确认删除选中的1条执行记录吗？' })
      .last();
    await expect(deleteConfirm).toBeVisible();
    await deleteConfirm
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(await deletePromise, 'delete execution log');
    await expectPageEnvelope<JobExecutionLog>(
      await deleteReloadPromise,
      'reload execution logs',
    );

    const cleanPromise = waitForApiResponse(
      page,
      'DELETE',
      '/monitor/job/log/clean',
    );
    const cleanReloadPromise = waitForApiResponse(
      page,
      'GET',
      '/monitor/job/log/list',
    );
    await drawer.getByRole('button', { exact: true, name: '清空' }).click();
    const cleanConfirm = page
      .getByRole('dialog')
      .filter({ hasText: '确认清空所有任务的执行记录吗？此操作不可恢复。' })
      .last();
    await expect(cleanConfirm).toBeVisible();
    await cleanConfirm
      .getByRole('button', { name: antButtonNames.confirmAction })
      .click();
    await expectSuccessEnvelope(await cleanPromise, 'clean execution logs');
    await expectPageEnvelope<JobExecutionLog>(
      await cleanReloadPromise,
      'reload cleaned execution logs',
    );
  } finally {
    await expectSuccessEnvelope(
      await request.put(
        `${apiURL}/monitor/job/${cleanupJobName}/${job.enabled ? 'start' : 'stop'}`,
        {
          data: {},
          headers,
        },
      ),
      'restore job status',
    );
    await expectSuccessEnvelope(
      await request.put(`${apiURL}/monitor/job/${cleanupJobName}/config`, {
        data: {
          maxRetries: job.maxRetries,
          retryIntervalMs: job.retryIntervalMs,
        },
        headers,
      }),
      'restore retry config',
    );
  }
});
