<script lang="tsx" setup>
import type { FormType } from './form-modal.vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NTag } from 'naive-ui';

import { requestClient } from '#/api/request';
import { renderDict } from '#/utils/render';

import formModal from './form-modal.vue';
import roleAuthModal from './role-auth-modal.vue';

/**
 * authScopeOptions user也会用到
 * 限制 type 类型为 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
 */

const authScopeOptions = [
  { type: 'info', label: '全部数据权限', value: '1' },
  { type: 'default', label: '自定数据权限', value: '2' },
  { type: 'success', label: '本部门数据权限', value: '3' },
  { type: 'warning', label: '本部门及以下数据权限', value: '4' },
  { type: 'error', label: '仅本人数据权限', value: '5' },
  { type: 'warning', label: '部门及以下或本人数据权限', value: '6' },
];

const message = useMessage();
const dialog = useDialog();

// 数据类型字段
interface RoleVo {
  /** 角色ID */
  roleId: string;
  /** 角色名称 */
  roleName: string;
  /** 角色权限字符串 */
  roleKey: string;
  /** 显示顺序 */
  roleSort: number;
  /** 数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限 6：部门及以下或本人数据权限） */
  dataScope: string;
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly: number;
  /** 部门树选择项是否关联显示 */
  deptCheckStrictly: number;
  /** 角色状态（0正常 1停用） */
  status: string;
  /** 创建时间 */
  createTime: string;
  /** 备注 */
  remark: string;
}

// 查询表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入角色名称',
      },
      fieldName: 'roleName',
      label: '角色名称',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入角色权限字符串',
      },
      fieldName: 'roleKey',
      label: '角色权限字符串',
    },
  ],
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
const gridOptions: VxeGridProps<RoleVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'id', title: '角色ID', visible: false },
    { field: 'roleName', title: '角色名称' },
    { field: 'roleKey', title: '角色权限字符串' },
    { field: 'roleSort', title: '显示顺序' },

    {
      field: 'dataScope',
      title: '数据权限',
      slots: {
        default: ({ row }) => {
          const found = authScopeOptions.find(
            (item) => item.value === row.dataScope,
          );
          if (found) {
            return <NTag type={'default'}>{found.label}</NTag>;
          }
          return <NTag type={'error'}>{row.dataScope}</NTag>;
        },
      },
    },
    {
      field: 'status',
      title: '角色状态',
      slots: {
        default: ({ row }) => {
          return renderDict(row.status, 'sys_normal_disable');
        },
      },
    },
    { field: 'createTime', formatter: 'formatDateTime', title: '创建时间' },
    { field: 'remark', title: '备注' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 350,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return await requestClient.get<RoleVo[]>('/system/role/list', {
          params: {
            currentPage,
            pageSize,
            ...formValues,
          },
        });
      },
    },
  },

  rowConfig: {
    keyField: 'roleId',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 角色信息表单弹窗
const [RoleFromModal, formModelApi] = useVbenModal({
  connectedComponent: formModal,
});

// 角色信息表单弹窗
const [RoleAuthModal, roleAuthModelApi] = useVbenModal({
  connectedComponent: roleAuthModal,
});

function openModal(formType: FormType, row?: RoleVo) {
  formModelApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

function openRoleAuthModal(row?: RoleVo) {
  roleAuthModelApi
    .setData({
      row: row || {},
    })
    .open();
}

/**
 * 删除选中的角色信息数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的模板数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除角色信息提醒',
    content: `你确定要删除${records.length}条数据吗？`,
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: async () => {
      const ids = records.map((item) => item.roleId);
      await handleDelete(ids);
    },
  });
}

/**
 * 删除角色信息
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(`/system/role/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新角色信息表格数据
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
          <!-- <n-button class="mr-2"> 导出 </n-button> -->
          <n-button class="mr-2" type="error" @click="handleDeleteCheck">
            删除
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
            type="info"
            size="small"
            @click="openRoleAuthModal(row)"
            ghost
          >
            数据权限
          </n-button>
          <n-button
            type="info"
            size="small"
            @click="openRoleAuthModal(row)"
            ghost
          >
            分配用户
          </n-button>
          <n-popconfirm @positive-click="handleDelete(row.roleId)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除该角色信息吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <RoleFromModal @reload="refreshTable" />
    <RoleAuthModal @reload="refreshTable" />
  </Page>
</template>
