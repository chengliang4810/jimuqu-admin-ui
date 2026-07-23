import type { VxeGridProps } from 'vxe-table';

const scheduleTypeLabels: Record<string, string> = {
  CRON: 'Cron',
  FIXED_DELAY: '固定延迟',
  FIXED_RATE: '固定频率',
};

export const columns: VxeGridProps['columns'] = [
  {
    field: 'jobName',
    minWidth: 180,
    title: '任务标识',
  },
  {
    field: 'description',
    minWidth: 180,
    title: '任务说明',
  },
  {
    field: 'scheduleType',
    formatter: ({ cellValue }) =>
      scheduleTypeLabels[cellValue] ?? cellValue ?? '-',
    title: '调度方式',
    width: 130,
  },
  {
    field: 'scheduleExpression',
    formatter: ({ row }) =>
      row.scheduleType === 'CRON'
        ? row.scheduleExpression
        : `${row.scheduleExpression} ms`,
    minWidth: 180,
    title: '调度配置',
  },
  {
    field: 'enabled',
    resizable: false,
    slots: { default: 'status' },
    title: '状态',
    width: 110,
  },
  {
    field: 'action',
    fixed: 'right',
    resizable: false,
    slots: { default: 'action' },
    title: '操作',
    width: 280,
  },
];
