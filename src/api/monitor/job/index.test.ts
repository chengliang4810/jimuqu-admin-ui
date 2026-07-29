import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  jobAdd,
  jobHandlerList,
  jobList,
  jobLogClean,
  jobLogList,
  jobLogRemove,
  jobRemove,
  jobRun,
  jobStart,
  jobStop,
  jobUpdate,
  jobUpdateConfig,
} from '.';

const http = vi.hoisted(() => ({
  deleteWithMsg: vi.fn(),
  get: vi.fn(),
  postWithMsg: vi.fn(),
  putWithMsg: vi.fn(),
}));

vi.mock('@/utils/http', () => ({ alovaInstance: http }));

describe('scheduled job API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the Solon runtime job endpoints', () => {
    jobList();
    jobStart('demo job');
    jobStop('demo job');
    jobRun('demo job');

    expect(http.get).toHaveBeenCalledWith('/monitor/job/list');
    expect(http.putWithMsg).toHaveBeenNthCalledWith(
      1,
      '/monitor/job/demo%20job/start',
    );
    expect(http.putWithMsg).toHaveBeenNthCalledWith(
      2,
      '/monitor/job/demo%20job/stop',
    );
    expect(http.postWithMsg).toHaveBeenCalledWith(
      '/monitor/job/demo%20job/run',
    );
  });

  it('uses the dynamic job CRUD and handler whitelist endpoints', () => {
    const job = {
      concurrentPolicy: 'FORBID' as const,
      description: '清理临时文件',
      handlerKey: 'temporaryFileCleanup',
      initialDelayMs: 0,
      jobName: 'temporaryFileCleanupJob',
      maxRetries: 2,
      misfirePolicy: 'FIRE_ONCE' as const,
      retryIntervalMs: 1000,
      scheduleExpression: '0 0/5 * * * ? *',
      scheduleType: 'CRON' as const,
      zone: 'Asia/Shanghai',
    };

    jobHandlerList();
    jobAdd(job);
    jobUpdate('demo job', job);
    jobRemove('demo job');

    expect(http.get).toHaveBeenCalledWith('/monitor/job/handlers');
    expect(http.postWithMsg).toHaveBeenCalledWith('/monitor/job', job);
    expect(http.putWithMsg).toHaveBeenCalledWith(
      '/monitor/job/demo%20job',
      job,
    );
    expect(http.deleteWithMsg).toHaveBeenCalledWith('/monitor/job/demo%20job');
  });

  it('uses the retry configuration and execution log endpoints', () => {
    const config = { maxRetries: 3, retryIntervalMs: 1000 };
    const query = {
      jobName: 'demo job',
      pageNum: 1,
      pageSize: 10,
      status: 'FAILED',
    };

    jobUpdateConfig('demo job', config);
    jobLogList(query);
    jobLogRemove([1, 2]);
    jobLogClean();

    expect(http.putWithMsg).toHaveBeenCalledWith(
      '/monitor/job/demo%20job/config',
      config,
    );
    expect(http.get).toHaveBeenCalledWith('/monitor/job/log/list', {
      params: query,
    });
    expect(http.deleteWithMsg).toHaveBeenNthCalledWith(
      1,
      '/monitor/job/log/1,2',
    );
    expect(http.deleteWithMsg).toHaveBeenNthCalledWith(
      2,
      '/monitor/job/log/clean',
    );
  });
});
