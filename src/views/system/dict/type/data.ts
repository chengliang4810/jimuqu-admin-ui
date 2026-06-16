import type { VxeGridProps } from '@/adapter/vxe-table';


export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '字典名称',
    field: 'dictName',
  },
  {
    title: '字典类型',
    field: 'dictType',
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
