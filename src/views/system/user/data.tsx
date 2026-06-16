import type { VxeGridProps } from '@/adapter/vxe-table';

import { DictEnum } from '@/constants';
import { getPopupContainer } from '@/utils';
import { getDictOptions } from '@/utils/dict';


export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    field: 'userName',
    title: '名称',
    minWidth: 80,
  },
  {
    field: 'nickName',
    title: '昵称',
    minWidth: 130,
  },
  {
    field: 'avatar',
    title: '头像',
    slots: { default: 'avatar' },
    minWidth: 80,
  },
  {
    field: 'deptName',
    title: '部门',
    minWidth: 120,
  },
  {
    field: 'phoneNumber',
    title: '手机号',
    formatter({ cellValue }) {
      return cellValue || '暂无';
    },
    minWidth: 120,
  },
  {
    field: 'status',
    title: '状态',
    slots: { default: 'status' },
    minWidth: 100,
  },
  {
    field: 'createTime',
    title: '创建时间',
    minWidth: 150,
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
