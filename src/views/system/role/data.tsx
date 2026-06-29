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
  {
    type: 'checkbox',
    width: 45,
    align: 'center',
    resizable: false,
  },
  {
    title: '角色名称',
    field: 'roleName',
    minWidth: 120,
  },
  {
    title: '权限字符',
    field: 'roleKey',
    minWidth: 120,
    slots: {
      default: ({ row }) => {
        return <Tag color="processing">{row.roleKey}</Tag>;
      },
    },
  },
  {
    title: '数据权限',
    field: 'dataScope',
    minWidth: 180,
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
    resizable: false,
    align: 'center',
    width: 80,
  },
  {
    title: '状态',
    field: 'status',
    resizable: false,
    align: 'center',
    width: 80,
    slots: { default: 'status' },
  },
  // {
  //   field: 'createTime',
  //   title: '创建时间',
  //   width: 150,
  //   align: "center",
  //   resizable: false,
  // },
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
