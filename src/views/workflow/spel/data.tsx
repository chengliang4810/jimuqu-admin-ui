import type { VxeGridProps } from '@/adapter/vxe-table';

import { DictEnum } from '@/constants';
import { renderDict } from '@/utils/render';


export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '组件名称',
    field: 'componentName',
    formatter: ({ cellValue }) => cellValue ?? '-',
  },
  {
    title: '方法名称',
    field: 'methodName',
    formatter: ({ cellValue }) => cellValue ?? '-',
  },
  {
    title: '参数名称',
    field: 'methodParams',
  },
  {
    title: 'Spel表达式',
    field: 'viewSpel',
  },
  {
    title: '状态',
    field: 'status',
    width: 120,
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.SYS_NORMAL_DISABLE);
      },
    },
  },
  {
    title: '备注',
    field: 'remark',
  },
  {
    title: '创建时间',
    field: 'createTime',
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
