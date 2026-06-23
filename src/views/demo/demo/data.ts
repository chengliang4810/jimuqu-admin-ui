import type { VxeGridProps } from 'vxe-table';

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '主键',
    field: 'id',
  },
  {
    title: '排序号',
    field: 'orderNum',
  },
  {
    title: 'key键',
    field: 'testKey',
  },
  {
    title: '值',
    field: 'value',
  },
  {
    title: '版本',
    field: 'version',
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
