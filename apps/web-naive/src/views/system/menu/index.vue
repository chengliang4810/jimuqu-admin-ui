<script lang="tsx" setup>
import type { FormType } from './form-modal.vue';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';
import { FolderIcon, MenuIcon, OkButtonIcon, VbenIcon } from '@vben/icons';
import { getPopupContainer, treeToList } from '@vben/utils';

import { requestClient } from '#/api/request';
import { getDictOptions } from '#/utils/dict';
import { renderDict } from '#/utils/render';

import formModal from './form-modal.vue';

const message = useMessage();

// （M目录 C菜单 F按钮）
const menuTypes = {
  C: { icon: MenuIcon, value: '菜单' },
  F: { icon: OkButtonIcon, value: '按钮' },
  M: { icon: FolderIcon, value: '目录' },
};

// 数据类型字段
interface MenuVo {
  /** 菜单ID */
  id: string;
  /** 菜单名称 */
  menuName: string;
  /** 父菜单ID */
  parentId: string;
  /** 显示顺序 */
  orderNum: number;
  /** 路由地址 */
  path: string;
  /** 组件路径 */
  component: string;
  /** 路由参数 */
  queryParam: string;
  /** 是否为外链（0是 1否） */
  isFrame: number;
  /** 是否缓存（0缓存 1不缓存） */
  isCache: number;
  /** 菜单类型（M目录 C菜单 F按钮） */
  menuType: string;
  /** 显示状态（0显示 1隐藏） */
  visible: string;
  /** 菜单状态（0正常 1停用） */
  status: string;
  /** 权限标识 */
  perms: string;
  /** 菜单图标 */
  icon: string;
  /** 创建时间 */
  createTime: string;
  /** 备注 */
  remark: string;
}

// 查询表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  commonConfig: {
    labelWidth: 80,
    componentProps: {
      allowClear: true,
    },
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'menuName',
      label: '菜单名称 ',
    },
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        options: getDictOptions('sys_normal_disable'),
      },
      fieldName: 'status',
      label: '菜单状态 ',
    },
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        options: getDictOptions('sys_show_hide'),
      },
      fieldName: 'visible',
      label: '显示状态',
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单进行搜索
  submitOnChange: false,
  // 按下回车时是否提交表单进行搜索
  submitOnEnter: true,
};

// 表格配置
const gridOptions: VxeGridProps<MenuVo> = {
  columns: [
    { title: '菜单名称', field: 'menuName', treeNode: true, width: 200 },
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
              {h(current.icon, { class: 'size-[18px]' })}
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
          return renderDict(row.status, 'sys_normal_disable');
        },
      },
    },
    {
      title: '显示',
      field: 'visible',
      width: 100,
      slots: {
        default: ({ row }) => {
          return renderDict(row.visible, 'sys_show_hide');
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
      width: 200,
    },
  ],
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async (_, formValues) => {
        const data = await requestClient.get<MenuVo[]>('/system/menu/list', {
          params: {
            ...formValues,
          },
        });
        return { items: data };
      },
    },
  },
  /**
   * 虚拟滚动  默认关闭
   */
  scrollY: {
    enabled: false,
    gt: 0,
  },
  treeConfig: {
    parentField: 'parentId',
    rowField: 'id',
    transform: true,
  },
  rowConfig: {
    keyField: 'id',
  },
  id: 'system-menu-index',
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 菜单权限表单弹窗
const [TemplateFromModal, formModelApi] = useVbenModal({
  connectedComponent: formModal,
});

function openModal(formType: FormType, row?: MenuVo) {
  formModelApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

/**
 * 删除菜单权限
 * @param row 行数据
 */
async function handleDelete(row: any) {
  const menuAndChildren: any[] = treeToList([row], { id: 'id' });
  const ids = menuAndChildren.map((item) => item.id);
  const data = await requestClient.post(`/system/menu/delete/${ids}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新菜单权限表格数据
 */
async function refreshTable() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <n-button class="mr-2" @click="gridApi.grid?.clearTreeExpand">
            收起
          </n-button>
          <n-button class="mr-2" @click="gridApi.grid?.setAllTreeExpand(true)">
            展开
          </n-button>
          <n-button class="mr-2" type="primary" @click="openModal('add')">
            新增
          </n-button>
        </n-flex>
      </template>
      <template #action="{ row }">
        <n-flex class="mx-3" justify="space-around" size="small">
          <n-button
            type="info"
            size="small"
            @click="openModal('update', row)"
            ghost
          >
            编辑
          </n-button>
          <n-button
            type="primary"
            size="small"
            @click="openModal('add', row)"
            ghost
          >
            新增
          </n-button>
          <n-popconfirm @positive-click="handleDelete(row)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除该菜单及下级权限吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <TemplateFromModal @reload="refreshTable" />
  </Page>
</template>
