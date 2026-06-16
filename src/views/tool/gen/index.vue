<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { Recordable } from '@/types';

import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import {
  batchGenCode,
  generatedList,
  genRemove,
  getDataSourceNames,
  syncDb,
} from '@/api/tool/gen';
import { Page, useVbenModal } from '@/effects/common-ui';
import { downloadByData } from '@/utils/file/download';
import { Popconfirm, Space } from 'antdv-next';
import dayjs from 'dayjs';

import codePreviewModal from './code-preview-modal.vue';
import { columns } from './data';
import howToUseModal from './md/how-to-use-modal.vue';
import tableImportModal from './table-import-modal.vue';
import GenSearchForm from './gen-search.vue';

const searchFormRef = ref<InstanceType<typeof GenSearchForm>>();
const dataSourceOptions = ref<{ label: string; value: string }[]>([]);

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    trigger: 'row',
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await generatedList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'tableId',
  },
  id: 'tool-gen-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

onMounted(async () => {
  // 获取数据源
  const ret = await getDataSourceNames();
  const options = [{ label: '全部', value: '' }];
  const transOptions = ret.map((item) => ({ label: item, value: item }));
  options.push(...transOptions);
  dataSourceOptions.value = options;
});

const [CodePreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: codePreviewModal,
});

function handlePreview(record: Recordable<any>) {
  previewModalApi.setData({ tableId: record.tableId });
  previewModalApi.open();
}

const router = useRouter();
function handleEdit(record: Recordable<any>) {
  router.push(`/tool/gen-edit/index/${record.tableId}`);
}

async function handleSync(record: Recordable<any>) {
  await syncDb(record.tableId);
  await tableApi.query();
}

/**
 * 批量生成代码
 */
async function handleBatchGen() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: any) => row.tableId);
  if (ids.length === 0) {
    window.message.info('请选择需要生成代码的表');
    return;
  }
  const hideLoading = window.message.loading('下载中...');
  try {
    const params = ids.join(',');
    const data = await batchGenCode(params);
    const timestamp = Date.now();
    downloadByData(data, `批量代码生成_${timestamp}.zip`);
  } finally {
    hideLoading();
  }
}

async function handleDownload(record: Recordable<any>) {
  const hideLoading = window.message.loading('加载中...');
  try {
    const blob = await batchGenCode(record.tableId);
    const filename = `代码生成_${record.tableName}_${dayjs().valueOf()}.zip`;
    downloadByData(blob, filename);
  } catch (error) {
    console.error(error);
  } finally {
    hideLoading();
  }
}

/**
 * 删除
 * @param record
 */
async function handleDelete(record: Recordable<any>) {
  await genRemove(record.tableId);
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: any) => row.tableId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await genRemove(ids);
      await tableApi.query();
    },
  });
}

const [TableImportModal, tableImportModalApi] = useVbenModal({
  connectedComponent: tableImportModal,
});

function handleImport() {
  tableImportModalApi.open();
}

function handleSearchSubmit(data: Record<string, any>) {
  tableApi.reload(data);
}

function handleSearchReset() {
  tableApi.reload();
}

const [HowToUseModal, howToUseModalApi] = useVbenModal({
  connectedComponent: howToUseModal,
});
</script>

<template>
  <Page :auto-content-height="true">
    <div class="flex h-full flex-col gap-4">
      <GenSearchForm
        ref="searchFormRef"
        :data-source-options="dataSourceOptions"
        @submit="handleSearchSubmit"
        @reset="handleSearchReset"
      />
      <div class="flex-1">
        <BasicTable table-title="代码生成列表">
      <template #toolbar-tools>
        <Space>
          <a-button type="link" @click="howToUseModalApi.open()">
            如何使用🤔(beta版)
          </a-button>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            danger
            type="primary"
            v-access:code="['tool:gen:remove']"
            @click="handleMultiDelete"
          >
            {{ $t('pages.common.delete') }}
          </a-button>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
            v-access:code="['tool:gen:code']"
            @click="handleBatchGen"
          >
            {{ $t('pages.common.generate') }}
          </a-button>
          <a-button
            type="primary"
            v-access:code="['tool:gen:import']"
            @click="handleImport"
          >
            {{ $t('pages.common.import') }}
          </a-button>
        </Space>
      </template>
      <template #action="{ row }">
        <a-button
          size="small"
          type="link"
          v-access:code="['tool:gen:preview']"
          @click.stop="handlePreview(row)"
        >
          {{ $t('pages.common.preview') }}
        </a-button>
        <a-button
          size="small"
          type="link"
          v-access:code="['tool:gen:edit']"
          @click.stop="handleEdit(row)"
        >
          {{ $t('pages.common.edit') }}
        </a-button>
        <Popconfirm
          :title="`确认同步[${row.tableName}]?`"
          placement="left"
          @confirm="handleSync(row)"
        >
          <a-button
            size="small"
            type="link"
            v-access:code="['tool:gen:edit']"
            @click.stop=""
          >
            {{ $t('pages.common.sync') }}
          </a-button>
        </Popconfirm>
        <a-button
          size="small"
          type="link"
          v-access:code="['tool:gen:code']"
          @click.stop="handleDownload(row)"
        >
          生成代码
        </a-button>
        <Popconfirm
          :title="`确认删除[${row.tableName}]?`"
          placement="left"
          @confirm="handleDelete(row)"
        >
          <a-button
            danger
            size="small"
            type="link"
            v-access:code="['tool:gen:remove']"
            @click.stop=""
          >
            {{ $t('pages.common.delete') }}
          </a-button>
        </Popconfirm>
      </template>
    </BasicTable>
      </div>
    </div>
    <CodePreviewModal />
    <TableImportModal @reload="tableApi.query()" />
    <HowToUseModal />
  </Page>
</template>
