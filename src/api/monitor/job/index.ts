import type { IDS, PageResult } from '@/api/common';

import type {
  JobExecutionLog,
  JobLogQuery,
  JobRetryConfig,
  ScheduledJob,
  ScheduledJobHandler,
  ScheduledJobSave,
} from './model';

import { alovaInstance } from '@/utils/http';

const root = '/monitor/job';

/** 查询当前节点已注册的系统任务与动态任务。 */
export function jobList() {
  return alovaInstance.get<ScheduledJob[]>(`${root}/list`);
}

/** 查询允许界面选择的任务处理器白名单。 */
export function jobHandlerList() {
  return alovaInstance.get<ScheduledJobHandler[]>(`${root}/handlers`);
}

/** 创建动态任务。 */
export function jobAdd(data: ScheduledJobSave) {
  return alovaInstance.postWithMsg<void>(root, data);
}

/** 按原任务标识更新动态任务。 */
export function jobUpdate(jobName: string, data: ScheduledJobSave) {
  return alovaInstance.putWithMsg<void>(
    `${root}/${encodeURIComponent(jobName)}`,
    data,
  );
}

/** 删除动态任务，系统任务由后端拒绝删除。 */
export function jobRemove(jobName: string) {
  return alovaInstance.deleteWithMsg<void>(
    `${root}/${encodeURIComponent(jobName)}`,
  );
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
