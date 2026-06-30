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
    title: '公告标题',
    field: 'noticeTitle',
    align: 'left',
    headerAlign: 'center',
    minWidth: 240,
    slots: {
      default: ({ row }) => {
        return (
          <div class="flex items-center gap-2">
            {renderDict(row.noticeType, DictEnum.SYS_NOTICE_TYPE)}
            <div
              class="overflow-hidden text-ellipsis whitespace-nowrap"
              title={row.noticeTitle}
            >
              {row.noticeTitle}
            </div>
          </div>
        );
      },
    },
  },
  {
    title: '状态',
    field: 'status',
    resizable: false,
    align: 'center',
    width: 80,
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.SYS_NOTICE_STATUS);
      },
    },
  },
  {
    title: '发布人',
    field: 'createByName',
    width: 150,
    resizable: false,
  },
  {
    field: 'createTime',
    title: '发布时间',
    width: 160,
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
