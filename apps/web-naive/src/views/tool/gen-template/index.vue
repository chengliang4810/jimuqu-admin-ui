<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { getGenTemplateList } from '#/api';

// import { message } from 'naive-ui';

// import { getExampleTableApi } from '../mock-api';

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
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板名称',
      },
      fieldName: 'name',
      label: '模板名称',
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
    { field: 'name', title: '模板名称' },
    { field: 'path', title: '生成路径' },
    { field: 'remark', title: '备注' },
    { field: 'updateTime', formatter: 'formatDateTime', title: '最后更新时间' },
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
        return await getGenTemplateList({
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
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 48,
  },
  rowConfig: {
    keyField: 'userId',
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <n-button class="mr-2"> 导出 </n-button>
          <n-button class="mr-2" type="error"> 删除 </n-button>
          <n-button class="mr-2" type="primary"> 新增 </n-button>
        </n-flex>
      </template>
      <template #action>
        <n-flex class="mx-3" justify="space-around" size="small">
          <n-button type="info" size="small" ghost>编辑</n-button>
          <n-button type="error" size="small" ghost>删除</n-button>
        </n-flex>
      </template>
    </Grid>
  </Page>
</template>
