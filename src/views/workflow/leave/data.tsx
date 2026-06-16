import type { VxeGridProps } from '@/adapter/vxe-table';

import { OptionsTag } from '@/components/table';
import { DictEnum } from '@/constants';
import { renderDict } from '@/utils/render';
import dayjs from 'dayjs';

export const leaveTypeOptions = [
  { label: '病假 😷', value: '1' },
  { label: '事假 🖥', value: '2' },
  { label: '年假 🏝', value: '3' },
  { label: '婚假 💒', value: '4' },
  { label: '产假 🤰', value: '5' },
  { label: '其他 🤔', value: '7' },
];

export const leaveFlowOptions = [
  { label: '请假流程-普通', value: 'leave1' },
  { label: '请假流程-排他网关', value: 'leave2' },
  { label: '请假流程-并行网关', value: 'leave3' },
  { label: '请假流程-会签', value: 'leave4' },
  { label: '请假申请-并行会签网关', value: 'leave5' },
  { label: '请假申请-排他并行网关', value: 'leave6' },
];


export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '请假类型',
    field: 'leaveType',
    slots: {
      default: ({ row }) => {
        return <OptionsTag options={leaveTypeOptions} value={row.leaveType} />;
      },
    },
  },
  {
    title: '开始时间',
    field: 'startDate',
    formatter: ({ cellValue }) => dayjs(cellValue).format('YYYY-MM-DD'),
  },
  {
    title: '结束时间',
    field: 'endDate',
    formatter: ({ cellValue }) => dayjs(cellValue).format('YYYY-MM-DD'),
  },
  {
    title: '请假天数',
    field: 'leaveDays',
    formatter: ({ cellValue }) => `${cellValue}天`,
  },
  {
    title: '请假原因',
    field: 'remark',
  },
  {
    title: '流程状态',
    field: 'status',
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.WF_BUSINESS_STATUS);
      },
    },
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    resizable: false,
    width: 'auto',
  },
];
