import type { VxeGridProps } from '@/adapter/vxe-table';

export const columns: VxeGridProps['columns'] = [
  {
    field: 'categoryName',
    title: '分类名称',
    treeNode: true,
  },
  {
    field: 'orderNum',
    title: '排序',
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
