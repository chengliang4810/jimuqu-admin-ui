import type { VxeGridProps } from 'vxe-table';

import { DictEnum } from '@/constants';
import { renderDict } from '@/utils/render';

export const columns: VxeGridProps['columns'] = [
  {
    type: 'checkbox',
    width: 45,
    align: 'center',
    resizable: false,
  },
  {
    title: '参数名称',
    field: 'configName',
    minWidth: 240,
  },
  {
    title: '参数键名',
    field: 'configKey',
    minWidth: 240,
  },
  {
    title: '参数键值',
    field: 'configValue',
    minWidth: 240,
  },
  {
    title: '备注信息',
    field: 'remark',
    minWidth: 240,
  },
  {
    title: '内置',
    field: 'configType',
    width: 80,
    align: 'center',
    slots: {
      default: ({ row }) => {
        return renderDict(row.configType, DictEnum.SYS_YES_NO);
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
