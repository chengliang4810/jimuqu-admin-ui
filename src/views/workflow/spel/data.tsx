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
    title: 'Spel表达式',
    field: 'viewSpel',
    align: 'left',
    headerAlign: 'center',
    minWidth: 240,
    slots: {
      default: ({ row }) => {
        if (true){
          const prefix = row.viewSpel.slice(0, row.viewSpel.indexOf('{') + 1);
          const componentName = row.viewSpel.slice(
            row.viewSpel.indexOf('{') + 1,
            row.viewSpel.indexOf('.'),
          );
          const methodName = row.viewSpel.slice(
            row.viewSpel.indexOf('.'),
            row.viewSpel.indexOf('('),
          );
          const methodParams = row.viewSpel.slice(
            row.viewSpel.indexOf('('),
            row.viewSpel.indexOf(')'),
          );
          const suffix = row.viewSpel.slice(
            row.viewSpel.indexOf(')'),
            row.viewSpel.indexOf('}') + 1,
          );
          return (
            <div class="overflow-hidden font-bold text-ellipsis whitespace-nowrap">
              {prefix}
              <span class="text-blue-700">{componentName}</span>
              <span class="text-purple-700">{methodName}</span>
              <span class="text-red-700">{methodParams}</span>
              {suffix}
            </div>
          );
        }
      },
    },
  },
  {
    title: '描述说明',
    field: 'remark',
    align: 'left',
    headerAlign: 'center',
    minWidth: 200,
  },
  {
    title: '状态',
    field: 'status',
    resizable: false,
    align: 'center',
    width: 100,
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.SYS_NORMAL_DISABLE);
      },
    },
  },
  {
    field: 'createTime',
    title: '创建时间',
    width: 180,
    align: 'center',
    resizable: false,
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
