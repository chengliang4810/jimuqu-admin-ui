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
    field: 'userName',
    title: '用户账号',
    minWidth: 80,
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
  {
    field: 'deptName',
    title: '所属部门',
    minWidth: 120,
  },
  {
    field: 'createTime',
    title: '创建时间',
    width: 180,
    align: 'center',
    resizable: false,
  },
  {
    field: 'status',
    title: '状态',
    slots: { default: 'status' },
    width: 80,
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
