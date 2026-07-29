import type { PageQuery } from '@/api/common';

/** 任务并发执行策略。 */
export type JobConcurrentPolicy = 'ALLOW' | 'FORBID';
/** 节点恢复后的错过执行策略。 */
export type JobMisfirePolicy = 'FIRE_ONCE' | 'IGNORE';
/** Solon 支持的调度类型。 */
export type JobScheduleType = 'CRON' | 'FIXED_DELAY' | 'FIXED_RATE';
/** 任务定义来源。 */
export type JobSource = 'DYNAMIC' | 'SYSTEM';
/** 当前节点的任务运行状态。 */
export type JobRuntimeStatus = 'ERROR' | 'RUNNING' | 'STOPPED';

/** 定时任务列表项。 */
export interface ScheduledJob {
  /** 是否允许同一任务并发执行。 */
  concurrentPolicy: JobConcurrentPolicy;
  /** 任务用途说明。 */
  description: string;
  /** 是否启用调度。 */
  enabled: boolean;
  /** 后端白名单处理器标识。 */
  handlerKey: string;
  /** 应用启动后的首次执行延迟，单位毫秒。 */
  initialDelayMs: number;
  /** 任务唯一标识。 */
  jobName: string;
  /** 系统注册任务或界面创建的动态任务。 */
  jobSource: JobSource;
  /** 失败后的最大重试次数。 */
  maxRetries: number;
  /** 节点恢复后的错过执行策略。 */
  misfirePolicy: JobMisfirePolicy;
  /** 失败后的重试间隔，单位毫秒。 */
  retryIntervalMs: number;
  /** 当前节点的运行异常说明。 */
  runtimeError?: string;
  /** 当前节点的实际运行状态。 */
  runtimeStatus: JobRuntimeStatus;
  /** Cron 表达式或固定间隔毫秒数。 */
  scheduleExpression: string;
  /** Cron、固定频率或固定延迟。 */
  scheduleType: JobScheduleType;
  /** Cron 计算使用的 IANA 时区。 */
  zone: string;
}

/** 后端显式开放给动态任务调用的方法。 */
export interface ScheduledJobHandler {
  /** Solon Bean 名称。 */
  beanName: string;
  /** 处理器所在类名。 */
  className: string;
  /** 面向管理员的处理器说明。 */
  description: string;
  /** 保存到任务定义中的稳定白名单标识。 */
  handlerKey: string;
  /** 实际执行的方法名称。 */
  methodName: string;
}

/** 新增或编辑动态任务的请求体。 */
export type ScheduledJobSave = Omit<
  ScheduledJob,
  'enabled' | 'jobSource' | 'runtimeError' | 'runtimeStatus'
>;

export interface JobRetryConfig {
  maxRetries: number;
  retryIntervalMs: number;
}

export interface JobExecutionLog {
  attempt: number;
  durationMs: number;
  endTime?: string;
  errorSummary?: string;
  executionId: string;
  instanceId: string;
  jobName: string;
  logId: number | string;
  startTime: string;
  status: 'FAILED' | 'RETRY' | 'SKIPPED' | 'SUCCESS';
  triggerType: string;
}

export interface JobLogQuery extends PageQuery {
  jobName: string;
  status?: string;
  triggerType?: string;
}
