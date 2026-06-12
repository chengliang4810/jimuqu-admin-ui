import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DictEnum } from '@vben/constants';
import { getPopupContainer } from '@vben/utils';

import { Tag } from 'antdv-next';

import { getDictOptions } from '#/utils/dict';

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

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'roleName',
    label: '角色名称',
  },
  {
    component: 'Input',
    fieldName: 'roleKey',
    label: '权限字符',
  },
  {
    component: 'Select',
    componentProps: {
      options: getDictOptions(DictEnum.SYS_NORMAL_DISABLE),
    },
    fieldName: 'status',
    label: '状态',
  },
  {
    component: 'RangePicker',
    fieldName: 'createTime',
    label: '创建时间',
  },
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
        const found = authScopeOptions.find((item) => item.value === row.dataScope);
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

export const drawerSchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
    fieldName: 'roleId',
    label: '角色ID',
  },
  {
    component: 'Input',
    fieldName: 'roleName',
    label: '角色名称',
    rules: 'required',
  },
  {
    component: 'Input',
    fieldName: 'roleKey',
    help: '如: test simpleUser等',
    label: '权限标识',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'roleSort',
    label: '角色排序',
    rules: 'required',
    defaultValue: 1,
    componentProps: {
      rootClass: 'flex-1',
    },
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: false,
      options: getDictOptions(DictEnum.SYS_NORMAL_DISABLE),
      getPopupContainer,
    },
    defaultValue: '0',
    fieldName: 'status',
    help: '修改后, 拥有该角色的用户将自动下线.',
    label: '角色状态',
    rules: 'required',
  },
  {
    component: 'Textarea',
    defaultValue: '',
    fieldName: 'remark',
    formItemClass: 'col-span-2',
    label: '备注',
  },
  {
    component: 'Input',
    defaultValue: [],
    fieldName: 'menuIds',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
  {
    component: 'Input',
    defaultValue: [],
    fieldName: 'deptIds',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
  },
];
