import type { FormSchemaGetter } from '@/adapter/form';
import type { VxeGridProps } from '@/adapter/vxe-table';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'parentId',
    label: '父id',
  },
  {
    component: 'Input',
    fieldName: 'deptId',
    label: '部门id',
  },
  {
    component: 'Input',
    fieldName: 'userId',
    label: '用户id',
  },
  {
    component: 'Input',
    fieldName: 'treeName',
    label: '值',
  },
  {
    component: 'Input',
    fieldName: 'version',
    label: '版本',
  },
];

export const columns: VxeGridProps['columns'] = [
  {
    title: '主键',
    field: 'id',
    treeNode: true,
  },
  {
    title: '父id',
    field: 'parentId',
  },
  {
    title: '部门id',
    field: 'deptId',
  },
  {
    title: '用户id',
    field: 'userId',
  },
  {
    title: '值',
    field: 'treeName',
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
