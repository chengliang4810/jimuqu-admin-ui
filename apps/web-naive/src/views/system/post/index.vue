<script lang="ts" setup>
import type { FormType } from './form-modal.vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { requestClient } from '#/api/request';
import DeptTree from '#/views/system/dept/dept-tree.vue';

import formModal from './form-modal.vue';

const message = useMessage();
const dialog = useDialog();

// 数据类型字段
interface PostVo {
  /** 岗位ID */
  postId: string;
  /** 部门id */
  deptId: string;
  /** 岗位编码 */
  postCode: string;
  /** 岗位类别编码 */
  postCategory: string;
  /** 岗位名称 */
  postName: string;
  /** 显示顺序 */
  postSort: number;
  /** 状态（0正常 1停用） */
  status: string;
  /** 创建时间 */
  createTime: string;
  /** 备注 */
  remark: string;
}

// 左边部门用
const selectDeptId = ref<string[]>([]);

// 查询表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    // {
    //   component: 'Input',
    //   componentProps: {
    //     placeholder: '请输入部门id',
    //   },
    //   fieldName: 'deptId',
    //   label: '部门id',
    // },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入岗位编码',
      },
      fieldName: 'postCode',
      label: '岗位编码',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入岗位名称',
      },
      fieldName: 'postName',
      label: '岗位名称',
    },
  ],
  handleReset: async () => {
    selectDeptId.value = [];

    const { formApi, reload } = gridApi;
    await formApi.resetForm();
    const formValues = formApi.form.values;
    formApi.setLatestSubmissionValues(formValues);
    await reload(formValues);
  },
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
const gridOptions: VxeGridProps<PostVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'postId', title: '岗位ID', visible: false },
    { field: 'deptId', title: '部门id', visible: false },
    { field: 'postCode', title: '岗位编码' },
    { field: 'postCategory', title: '岗位类别编码' },
    { field: 'postName', title: '岗位名称' },
    { field: 'postSort', title: '显示顺序' },
    { field: 'status', title: '状态' },
    { field: 'createTime', formatter: 'formatDateTime', title: '创建时间' },
    { field: 'remark', title: '备注' },
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
        return await requestClient.get<PostVo[]>('/system/post/list', {
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
    keyField: 'postId',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 岗位信息表单弹窗
const [TemplateFromModal, formModelApi] = useVbenModal({
  connectedComponent: formModal,
});

function openModal(formType: FormType, row?: PostVo) {
  formModelApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

/**
 * 删除选中的岗位信息数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的模板数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除岗位信息提醒',
    content: `你确定要删除${records.length}条数据吗？`,
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: async () => {
      const ids = records.map((item) => item.postId);
      await handleDelete(ids);
    },
  });
}

/**
 * 删除岗位信息
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(`/system/post/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新岗位信息表格数据
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
          <n-popconfirm @positive-click="handleDelete(row.postId)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除该岗位信息吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <TemplateFromModal @reload="refreshTable" />
  </Page>
</template>
