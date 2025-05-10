<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

// import { message } from 'naive-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getGenTemplateList } from '#/api';

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
    // search: true,
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid />
  </Page>
</template>
