<script lang="ts" setup>
import type { FormType } from './form-modal.vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { requestClient } from '#/api/request';
import { renderDict } from '#/utils/render';
import DeptTree from '#/views/system/dept/dept-tree.vue';

import formModal from './form-modal.vue';

const message = useMessage();
const dialog = useDialog();
// 左边部门用
const selectDeptId = ref<string>('');

// 数据类型字段
interface UserVo {
  /** 用户ID */
  id: string;
  /** 部门ID */
  deptId: string;
  /** 用户账号 */
  userName: string;
  /** 用户昵称 */
  nickName: string;
  /** 用户类型（sys_user系统用户） */
  userType: string;
  /** 用户邮箱 */
  email: string;
  /** 手机号码 */
  phonenumber: string;
  /** 用户性别（0男 1女 2未知） */
  sex: string;
  /** 头像地址 */
  avatar: number;
  /** 密码 */
  password: string;
  /** 帐号状态（0正常 1停用） */
  status: string;
  /** 最后登录IP */
  loginIp: string;
  /** 最后登录时间 */
  loginDate: string;
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
        placeholder: '请输入用户账号',
      },
      fieldName: 'userName',
      label: '用户账号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户昵称',
      },
      fieldName: 'nickName',
      label: '用户昵称',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
      },
      fieldName: 'phonenumber',
      label: '手机号码',
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
const gridOptions: VxeGridProps<UserVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'id', title: '用户ID', visible: false },
    { field: 'userName', title: '账号' },
    { field: 'nickName', title: '昵称' },
    { field: 'email', title: '邮箱' },
    { field: 'phonenumber', title: '手机号码' },
    // { field: 'sex', title: '性别' },
    { field: 'avatar', title: '头像' },
    {
      field: 'status',
      title: '帐号状态',
      slots: {
        default: ({ row }) => {
          return renderDict(row.status, 'sys_normal_disable');
        },
      },
    },
    { field: 'loginIp', title: '最后登录IP' },
    { field: 'loginDate', formatter: 'formatDateTime', title: '最后登录时间' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 150,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        if (selectDeptId.value) {
          formValues.deptId = selectDeptId.value;
        }
        return await requestClient.get<UserVo[]>('/system/user/list', {
          params: {
            currentPage,
            pageSize,
            ...formValues,
          },
        });
      },
    },
  },
  toolbarConfig: {
    // 是否显示搜索表单控制按钮
    // @ts-ignore 正式环境时有完整的类型声明
    custom: true,
    // import: true,
    refresh: true,
    zoom: true,
  },
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 48,
  },
  rowConfig: {
    keyField: 'id',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 用户信息表单弹窗
const [TemplateFromModal, formModelApi] = useVbenModal({
  connectedComponent: formModal,
});

function openModal(formType: FormType, row?: UserVo) {
  formModelApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

/**
 * 删除选中的用户信息数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的模板数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除用户信息提醒',
    content: `你确定要删除${records.length}条数据吗？`,
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: async () => {
      const ids = records.map((item) => item.id);
      await handleDelete(ids);
    },
  });
}

/**
 * 删除用户信息
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(`/system/user/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新用户信息表格数据
 */
async function refreshTable() {
  gridApi.reload();
}
</script>

<template>
  <Page :auto-content-height="true" content-class="flex gap-[8px] w-full">
    <DeptTree
      v-model:select-dept-id="selectDeptId"
      class="w-[260px]"
      @reload="() => gridApi.reload()"
      @select="() => gridApi.reload()"
    />
    <Grid class="flex-1 overflow-hidden">
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
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除该用户信息吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <TemplateFromModal @reload="refreshTable" />
  </Page>
</template>
