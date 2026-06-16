import type { VxeGridProps } from '@/adapter/vxe-table';

import { DictEnum } from '@/constants';
import { getDictOptions } from '@/utils/dict';
import { Tag } from 'antdv-next';

const accessPolicyOptions = [
  { color: 'orange', label: '私有', value: '0' },
  { color: 'green', label: '公开', value: '1' },
  { color: 'blue', label: '自定义', value: '2' },
];


export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '配置名称',
    field: 'configKey',
  },
  {
    title: '访问站点',
    field: 'endpoint',
    showOverflow: true,
  },
  {
    title: '桶名称',
    field: 'bucketName',
  },
  {
    title: '域',
    field: 'region',
  },
  {
    title: '权限桶类型',
    field: 'accessPolicy',
    slots: {
      default: ({ row }) => {
        const current = accessPolicyOptions.find(
          (item) => item.value === row.accessPolicy,
        );
        if (current) {
          return <Tag color={current.color}>{current.label}</Tag>;
        }
        return '未知类型';
      },
    },
  },
  {
    title: '是否默认',
    field: 'status',
    slots: {
      default: 'status',
    },
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
