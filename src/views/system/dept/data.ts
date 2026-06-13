import type { FormSchemaGetter } from '@/adapter/form';
import type { VxeGridProps } from '@/adapter/vxe-table';

import { DictEnum } from '@/constants';
import { getPopupContainer } from '@/utils';

import { getDictOptions } from '@/utils/dict';
import { renderDict } from '@/utils/render';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'deptName',
    label: '部门名称',
  },
  {
    component: 'Select',
    componentProps: {
      getPopupContainer,
      options: getDictOptions(DictEnum.SYS_NORMAL_DISABLE),
    },
    fieldName: 'status',
    label: '部门状态',
  },
];

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

export const drawerSchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    dependencies: {
      show: () => false,
      triggerFields: [''],
    },
    fieldName: 'deptId',
  },
  {
    component: 'TreeSelect',
    componentProps: {
      getPopupContainer,
    },
    dependencies: {
      show: (model) => model.parentId !== 0,
      triggerFields: ['parentId'],
    },
    fieldName: 'parentId',
    label: '上级部门',
    rules: 'selectRequired',
  },
  {
    component: 'Input',
    fieldName: 'deptName',
    label: '部门名称',
    rules: 'required',
  },
  {
    component: 'InputNumber',
    fieldName: 'orderNum',
    label: '显示排序',
    rules: 'required',
    defaultValue: 1,
    componentProps: {
      class: 'flex-1',
    },
  },
  {
    component: 'Input',
    fieldName: 'deptCategory',
    label: '类别编码',
  },
  {
    component: 'Select',
    componentProps: {
      // 选中了就只能修改 不能重置为无负责人
      allowClear: false,
      getPopupContainer,
    },
    fieldName: 'leader',
    label: '负责人',
  },
  {
    component: 'Input',
    fieldName: 'phone',
    label: '联系电话',
    rules: { message: '请输入正确的手机号', pattern: /^1[3,4578]\d{9}$/ },
  },
  {
    component: 'Input',
    fieldName: 'email',
    label: '邮箱',
    rules: { message: '请输入正确的邮箱', type: 'email' },
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: getDictOptions(DictEnum.SYS_NORMAL_DISABLE),
      optionType: 'button',
    },
    defaultValue: '0',
    fieldName: 'status',
    label: '状态',
  },
];
