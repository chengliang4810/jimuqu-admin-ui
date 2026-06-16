import type { VxeGridProps } from '@/adapter/vxe-table';

import { DictEnum } from '@/constants';
import { getPopupContainer } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { renderDict } from '@/utils/render';


export const columns: VxeGridProps['columns'] = [
  {
    field: 'deptName',
    title: '部门名称',
    treeNode: true,
  },
  {
    field: 'deptCategory',
    title: '类别编码',
  },
  {
    field: 'orderNum',
    title: '排序',
  },
  {
    field: 'status',
    title: '状态',
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.SYS_NORMAL_DISABLE);
      },
    },
  },
  {
    field: 'createTime',
    title: '创建时间',
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
