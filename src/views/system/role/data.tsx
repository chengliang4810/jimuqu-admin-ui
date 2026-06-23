import type { VxeGridProps } from 'vxe-table';

import { Tag } from 'antdv-next';

/**
 * authScopeOptions user也会用到
 */
export const authScopeOptions = [
  { color: 'green', label: '全部数据权限', value: '1' },
  { color: 'default', label: '自定数据权限', value: '2' },
  { color: 'orange', label: '本部门数据权限', value: '3' },
  { color: 'cyan', label: '本部门及以下数据权限', value: '4' },
  { color: 'error', label: '仅本人数据权限', value: '5' },
  { color: 'default', label: '部门及以下或本人数据权限', value: '6' },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '角色名称',
    field: 'roleName',
  },
  {
    title: '权限字符',
    field: 'roleKey',
    slots: {
      default: ({ row }) => {
        return <Tag color="processing">{row.roleKey}</Tag>;
      },
    },
  },
  {
    title: '数据权限',
    field: 'dataScope',
    slots: {
      default: ({ row }) => {
        const found = authScopeOptions.find(
          (item) => item.value === row.dataScope,
        );
        if (found) {
          return <Tag color={found.color}>{found.label}</Tag>;
        }
        return <Tag>{row.dataScope}</Tag>;
      },
    },
  },
  {
    title: '排序',
    field: 'roleSort',
  },
  {
    title: '状态',
    field: 'status',
    slots: { default: 'status' },
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
