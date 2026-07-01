import type { VxeGridProps } from 'vxe-table';

import { DictEnum } from '@/constants';
import { renderDict } from '@/utils/render';

export const columns: VxeGridProps['columns'] = [
  {
    field: 'deptName',
    title: '部门名称',
    treeNode: true,
    minWidth: 240,
    headerAlign: 'center',
    align: 'left',
  },
  {
    field: 'deptCategory',
    title: '类别编码',
    minWidth: 120,
    headerAlign: 'center',
    align: 'left',
  },
  {
    field: 'createTime',
    title: '创建时间',
    width: 160,
    align: 'center',
    resizable: false,
  },
  {
    field: 'orderNum',
    title: '排序',
    resizable: false,
    align: 'center',
    width: 90,
  },
  {
    field: 'status',
    title: '状态',
    resizable: false,
    align: 'center',
    width: 90,
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.SYS_NORMAL_DISABLE);
      },
    },
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
