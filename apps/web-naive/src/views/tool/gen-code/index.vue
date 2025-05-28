<script lang="ts" setup>
import { Page, useVbenModal } from '@vben/common-ui';

import { getGenCodeList } from '#/api';
import { downloadFile, requestClient as request } from '#/api/request';

import importTableModal from './import-table-modal.vue';
import previewCodeModal from './preview-code-modal.vue';

const message = useMessage();
const dialog = useDialog();

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
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { title: '序号', type: 'seq', width: 50 },
    { field: 'dataName', title: '数据源' },
    { field: 'tableName', title: '表名' },
    { field: 'tableComment', title: '描述' },
    { field: 'className', title: '实体名' },
    { field: 'updateTime', formatter: 'formatDateTime', title: '最后更新时间' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 260,
    },
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

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 导入表格
const [ImportTableModal, importTableModalApi] = useVbenModal({
  connectedComponent: importTableModal,
});

function handleImport() {
  importTableModalApi.open();
}

/**
 * 删除选中的数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除提醒',
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
 * 删除模板
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await request.post(`/tool/gen-code/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  gridApi.reload();
}

/**
 * 生成代码
 * @param id 主键，主键数组
 */
async function handleBatchGenCode(id: string | string[]) {
  await downloadFile(`/tool/gen-code/batch/${id}`);
  message.success(`生成成功`);
}

/**
 * 生成选中的数据
 */
async function handleBatchGenCodeCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要生成的表');
    return;
  }

  const ids = records.map((item) => item.id);
  await handleBatchGenCode(ids);
  message.success(`生成成功`);
}

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: previewCodeModal,
});

async function handlePreview(id: string) {
  previewModalApi.setData({ tableId: id });
  previewModalApi.open();
}

const router = useRouter();
function handleConfig(record: any) {
  router.push(`/tool/gen/config/${record.id}`);
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <n-button class="mr-2" @click="handleImport"> 导入 </n-button>
          <n-button
            class="mr-2"
            type="primary"
            @click="handleBatchGenCodeCheck"
          >
            生成
          </n-button>
          <n-button class="mr-2" type="error" @click="handleDeleteCheck">
            删除
          </n-button>
        </n-flex>
      </template>

      <template #action="{ row }">
        <n-flex class="mx-3" justify="space-around" size="small">
          <n-button
            type="primary"
            size="small"
            @click="handleBatchGenCode(row.id)"
            ghost
          >
            生成
          </n-button>
          <n-button
            type="info"
            size="small"
            @click="handlePreview(row.id)"
            ghost
          >
            预览
          </n-button>
          <n-button type="info" size="small" @click="handleConfig(row)" ghost>
            配置
          </n-button>
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>

    <!-- 导入数据库表 -->
    <ImportTableModal @reload="gridApi.reload()" />
    <!-- 代码预览 -->
    <PreviewModal />
  </Page>
</template>
