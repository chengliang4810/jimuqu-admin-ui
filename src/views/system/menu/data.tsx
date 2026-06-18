import type { VxeGridProps } from '@/adapter/vxe-table';

import { DictEnum } from '@/constants';
import { VbenIcon } from '@/icons-app';
import { $t } from '@/locales';
import { renderDict } from '@/utils/render';

// 菜单类型（M目录 C菜单 F按钮）
export const menuTypeOptions = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' },
];

export const yesNoOptions = [
  { label: '是', value: '0' },
  { label: '否', value: '1' },
];

// （M目录 C菜单 F按钮）
export const menuTypes = {
  C: {
    icon: <span class="icon-[material-symbols--menu]"></span>,
    value: '菜单',
  },
  F: {
    icon: <span class="icon-[mdi--button-pointer]"></span>,
    value: '按钮',
  },
  M: {
    icon: <span class="icon-[flat-color-icons--folder]"></span>,
    value: '目录',
  },
};
export const columns: VxeGridProps['columns'] = [
  {
    title: '菜单名称',
    field: 'menuName',
    treeNode: true,
    width: 200,
    // 层级更明显显示
    align: 'left',
    slots: {
      // 需要i18n支持 否则返回原始值
      default: ({ row }) => $t(row.menuName),
    },
  },
  {
    title: '图标',
    field: 'icon',
    width: 80,
    slots: {
      default: ({ row }) => {
        if (row?.icon === '#') {
          return '';
        }
        return (
          <span class={'flex justify-center'}>
            <VbenIcon icon={row.icon} />
          </span>
        );
      },
    },
  },
  {
    title: '排序',
    field: 'orderNum',
    width: 120,
  },
  {
    title: '组件类型',
    field: 'menuType',
    width: 150,
    slots: {
      default: ({ row }) => {
        const current = menuTypes[row.menuType as 'C' | 'F' | 'M'];
        if (!current) {
          return '未知';
        }
        return (
          <span class="flex items-center justify-center gap-1">
            {current.icon}
            <span>{current.value}</span>
          </span>
        );
      },
    },
  },
  {
    title: '权限标识',
    field: 'perms',
  },
  {
    title: '组件路径',
    field: 'component',
  },
  {
    title: '状态',
    field: 'status',
    width: 100,
    slots: {
      default: ({ row }) => {
        return renderDict(row.status, DictEnum.SYS_NORMAL_DISABLE);
      },
    },
  },
  {
    title: '显示',
    field: 'visible',
    width: 100,
    slots: {
      default: ({ row }) => {
        return renderDict(row.visible, DictEnum.SYS_SHOW_HIDE);
      },
    },
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
