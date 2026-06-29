import type { User } from '@/api/system/user/model';
import type { VxeGridProps } from 'vxe-table';

import { preferences } from '@/core/preferences';
import { Avatar } from 'antdv-next';

export const columns: VxeGridProps['columns'] = [
  {
    type: 'checkbox',
    width: 45,
    align: 'center',
    resizable: false,
  },
  {
    title: '用户账号',
    field: 'userName',
    minWidth: 120,
  },
  {
    title: '用户信息',
    field: 'nickName',
    align: 'left',
    minWidth: 200,
    slots: {
      default: ({ row }: { row: User }) => {
        return (
          <div class="flex items-center">
            <Avatar
              class="size-9"
              src={row.avatar || preferences.app.defaultAvatar}
            />
            <div class="ml-2 flex flex-col items-start overflow-hidden">
              <span
                class="text-foreground text-sm font-medium"
                title={row.nickName}
              >
                {row.nickName}
              </span>
              <span class="text-muted-foreground text-xs">
                {row.phoneNumber || '-'}
              </span>
            </div>
          </div>
        );
      },
    },
  },
];
