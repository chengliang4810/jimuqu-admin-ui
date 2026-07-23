import type { PageQuery } from '@/api/common';

export interface ScheduledJob {
  description: string;
  enabled: boolean;
  jobName: string;
  maxRetries: number;
  retryIntervalMs: number;
  scheduleExpression: string;
  scheduleType: string;
}

export interface JobRetryConfig {
  maxRetries: number;
  retryIntervalMs: number;
}

export interface JobExecutionLog {
  attempt: number;
  durationMs: number;
  endTime?: string;
  errorSummary?: string;
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
