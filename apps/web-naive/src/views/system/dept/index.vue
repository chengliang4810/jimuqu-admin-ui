<script lang="ts" setup>
import type { FormType } from './form-modal.vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { getPopupContainer } from '@vben/utils';

import { requestClient } from '#/api/request';
import { getDictOptions } from '#/utils/dict';
import { renderDict } from '#/utils/render';

import formModal from './form-modal.vue';

const message = useMessage();

// 数据类型字段
interface DeptVo {
  /** 部门名称 */
  deptName: string;
  /** 显示顺序 */
  orderNum: number;
  /** 负责人 */
  leader: number;
  /** 联系电话 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 部门状态（0正常 1停用） */
  status: string;
  /** 创建时间 */
  createTime: string;
}

// 查询表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入部门名称',
      },
      fieldName: 'deptName',
      label: '部门名称',
    },
    {
      component: 'Select',
      componentProps: {
        getPopupContainer,
        options: getDictOptions('sys_normal_disable'),
      },
      fieldName: 'status',
      label: '部门状态',
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
const gridOptions: VxeGridProps<DeptVo> = {
  id: 'system-dept-index',
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    // { field: 'id', title: '主键', visible: false },
    { field: 'deptName', title: '部门名称', treeNode: true },
    { field: 'orderNum', title: '显示顺序' },
    { field: 'leader', title: '负责人' },
    { field: 'phone', title: '联系电话' },
    { field: 'email', title: '邮箱' },
    {
      field: 'status',
      title: '部门状态',
      slots: {
        default: ({ row }) => {
          return renderDict(row.status, 'sys_normal_disable');
        },
      },
    },

    { field: 'createTime', formatter: 'formatDateTime', title: '创建时间' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 150,
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
        const data = await requestClient.get<DeptVo[]>('/system/dept/list', {
          params: {
            ...formValues,
          },
        });
        return { items: data };
      },
      // 默认请求接口后展开全部 不需要可以删除这段
      querySuccess: () => {
        // 默认展开全部
        gridApi.grid?.setAllTreeExpand(true);
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
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 部门表单弹窗
const [TemplateFromModal, formModelApi] = useVbenModal({
  connectedComponent: formModal,
});

function openModal(formType: FormType, row?: DeptVo) {
  formModelApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

/**
 * 删除选中的部门数据
 */
// async function _handleDeleteCheck() {
//   const records = gridApi.grid.getCheckboxRecords();
//   if (records.length <= 0) {
//     message.warning('请选择要删除的模板数据');
//     return;
//   }

//   // 确认删除
//   dialog.warning({
//     title: '删除部门提醒',
//     content: `你确定要删除${records.length}条数据吗？`,
//     positiveText: '确定',
//     negativeText: '取消',
//     draggable: true,
//     onPositiveClick: async () => {
//       const ids = records.map((item) => item.id);
//       await handleDelete(ids);
//     },
//   });
// }

/**
 * 删除部门
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(`/system/dept/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新部门表格数据
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
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除该部门吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <TemplateFromModal @reload="refreshTable" />
  </Page>
</template>
