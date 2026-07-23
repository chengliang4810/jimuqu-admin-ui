import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  jobList,
  jobLogClean,
  jobLogList,
  jobLogRemove,
  jobRun,
  jobStart,
  jobStop,
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
