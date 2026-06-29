import type { User } from '@/api/system/user/model';
import type { VxeGridProps } from 'vxe-table';

import { UserInfoCell } from '@/components';

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
          <UserInfoCell
            avatar={row.avatar}
            subtitle={row.phoneNumber}
            title={row.nickName}
          />
        );
      },
    },
  },
];
