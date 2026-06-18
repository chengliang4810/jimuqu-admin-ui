import type { VxeGridProps } from '@/adapter/vxe-table';
import type { DictData } from '@/api/system/dict/dict-data-model';

import { renderDictTag } from '@/utils/render';

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '字典标签',
    field: 'cssClass',
    slots: {
      default: ({ row }) => {
        const { dictValue } = row as DictData;
        return renderDictTag(dictValue, [row]);
      },
    },
  },
  {
    title: '字典键值',
    field: 'dictValue',
  },
  {
    title: '字典排序',
    field: 'dictSort',
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
