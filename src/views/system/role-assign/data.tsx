import type { VxeGridProps } from 'vxe-table';

export const columns: VxeGridProps['columns'] = [
  {
    type: 'checkbox',
    width: 45,
    align: 'center',
    resizable: false,
  },
  {
    title: '用户账号',
    field: 'userName',
    minWidth: 120,
  },
  {
    title: '用户昵称',
    field: 'nickName',
    minWidth: 120,
  },
  {
    title: '手机号码',
    field: 'phoneNumber',
    width: 120,
    align: 'center',
    resizable: false
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    resizable: false,
    align: 'center',
    width: 'auto',
  },
];
