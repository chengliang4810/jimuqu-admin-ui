import type { IDS, PageResult } from '@/api/common';

import type {
  JobExecutionLog,
  JobLogQuery,
  JobRetryConfig,
  ScheduledJob,
} from './model';

import { alovaInstance } from '@/utils/http';

const root = '/monitor/job';

export function jobList() {
  return alovaInstance.get<ScheduledJob[]>(`${root}/list`);
}

export function jobStart(jobName: string) {
  return alovaInstance.putWithMsg<void>(
    `${root}/${encodeURIComponent(jobName)}/start`,
  );
}

export function jobStop(jobName: string) {
  return alovaInstance.putWithMsg<void>(
    `${root}/${encodeURIComponent(jobName)}/stop`,
  );
}

export function jobRun(jobName: string) {
  return alovaInstance.postWithMsg<void>(
    `${root}/${encodeURIComponent(jobName)}/run`,
  );
}

export function jobUpdateConfig(jobName: string, data: JobRetryConfig) {
  return alovaInstance.putWithMsg<void>(
    `${root}/${encodeURIComponent(jobName)}/config`,
    data,
  );
}

export function jobLogList(params: JobLogQuery) {
  return alovaInstance.get<PageResult<JobExecutionLog>>(`${root}/log/list`, {
    params,
  });
}

export function jobLogRemove(ids: IDS) {
  return alovaInstance.deleteWithMsg<void>(`${root}/log/${ids}`);
}

export function jobLogClean() {
  return alovaInstance.deleteWithMsg<void>(`${root}/log/clean`);
}
