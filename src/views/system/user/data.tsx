import type { VxeGridProps } from 'vxe-table';

export const columns: VxeGridProps['columns'] = [
  {
    type: 'checkbox',
    width: 45,
    align: 'center',
    resizable: false,
  },
  {
    field: 'avatar',
    title: '头像',
    slots: { default: 'avatar' },
    width: 60,
    align: 'center',
  },
  {
    field: 'userName',
    title: '用户账号',
    minWidth: 80,
  },
  {
    field: 'nickName',
    title: '用户昵称',
    minWidth: 130,
  },
  {
    field: 'phoneNumber',
    title: '手机号码',
    formatter({ cellValue }) {
      return cellValue || '暂无';
    },
    width: 120,
    align: 'center',
    resizable: false,
  },
  {
    field: 'deptName',
    title: '所属部门',
    minWidth: 120,
  },
  {
    field: 'createTime',
    title: '创建时间',
    width: 150,
    align: 'center',
    resizable: false,
  },
  {
    field: 'status',
    title: '状态',
    slots: { default: 'status' },
    width: 80,
    align: 'center',
    resizable: false,
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
