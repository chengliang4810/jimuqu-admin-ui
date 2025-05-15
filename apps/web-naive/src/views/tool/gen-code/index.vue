<script lang="ts" setup>
import { Page, useVbenModal } from '@vben/common-ui';

import { getGenCodeList } from '#/api';

import importTableModal from './import-table-modal.vue';

interface RowType {
  category: string;
  color: string;
  id: string;
  price: string;
  productName: string;
  releaseDate: string;
}

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: '默认数据源',
            value: 'master',
          },
        ],
        placeholder: '请选择',
      },
      defaultValue: 'master',
      fieldName: 'dataName',
      label: '数据源',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入表名',
      },
      fieldName: 'tableName',
      label: '表名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入表描述',
      },
      fieldName: 'tableComment',
      label: '表描述',
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 30 },
    { title: '序号', type: 'seq', width: 50 },
    { field: 'dataName', title: '数据源' },
    { field: 'tableName', title: '表名' },
    { field: 'tableComment', title: '描述' },
    { field: 'className', title: '实体名' },
    { field: 'updateTime', formatter: 'formatDateTime', title: '最后更新时间' },
  ],
  keepSource: true,
  pagerConfig: {},
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getGenCodeList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
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
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });

// 导入表格
const [ImportTableModal, importTableModalApi] = useVbenModal({
  connectedComponent: importTableModal,
});

function handleImport() {
  importTableModalApi.open();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <n-button class="mr-2" type="primary" @click="handleImport">
            导入
          </n-button>
          <n-button class="mr-2"> 生成 </n-button>
          <n-button class="mr-2" type="error"> 删除 </n-button>
        </n-flex>
      </template>
    </Grid>

    <ImportTableModal />
  </Page>
</template>
