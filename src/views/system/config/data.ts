import type { VxeGridProps } from 'vxe-table';

import { DictEnum } from '@/constants';
import { renderDict } from '@/utils/render';

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '参数名称',
    field: 'configName',
  },
  {
    title: '参数KEY',
    field: 'configKey',
  },
  {
    title: '参数Value',
    field: 'configValue',
  },
  {
    title: '系统内置',
    field: 'configType',
    width: 120,
    slots: {
      default: ({ row }) => {
        return renderDict(row.configType, DictEnum.SYS_YES_NO);
      },
    },
  },
  {
    title: '备注',
    field: 'remark',
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
