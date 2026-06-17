<script setup lang="ts">
import type { Recordable } from '@/types';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { onMounted, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import {
  batchGenCode,
  generatedList,
  genRemove,
  getDataSourceNames,
  syncDb,
} from '@/api/tool/gen';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenModal } from '@/effects/common-ui';
import { downloadByData } from '@/utils/file/download';
import { Popconfirm, Space, Spin } from 'antdv-next';
import dayjs from 'dayjs';
import { VxeGrid } from 'vxe-table';

import codePreviewModal from './code-preview-modal.vue';
import { columns } from './data';
import howToUseModal from './md/how-to-use-modal.vue';
import tableImportModal from './table-import-modal.vue';
import GenSearchForm from './gen-search.vue';

const searchFormRef = ref<InstanceType<typeof GenSearchForm>>();

interface GenRow {
  tableId: number | string;
  tableName?: string;
  [key: string]: any;
}

const dataSourceOptions = ref<{ label: string; value: string }[]>([]);

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<GenRow>({
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
    showLoading: false,
    ajax: {
      query: async ({ page }, formValues = {}) => {
        tableLoading.value = true;
        try {
          return await generatedList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'tableId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'tool-gen-index',
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<GenRow>>('tableRef');
const { query, reload } = useTableQuery(searchFormRef, tableRef, syncCheckedRows);
const checkedRows = ref<GenRow[]>([]);

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
  await query();
}

/**
 * 批量生成代码
 */
async function handleBatchGen() {
  const rows = getCheckedRows();
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
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: any) => row.tableId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await genRemove(ids);
      await query();
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
  reload(data);
}

function handleSearchReset() {
  reload();
}

const [HowToUseModal, howToUseModalApi] = useVbenModal({
  connectedComponent: howToUseModal,
});

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as GenRow[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}


</script>

<template>
  <Page :auto-content-height="true">
    <Spin
      :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
      :spinning="tableLoading"
      size="large"
      :delay="300"
    >
      <div class="flex h-full flex-col gap-4">
        <GenSearchForm
          ref="searchFormRef"
          :data-source-options="dataSourceOptions"
          @submit="handleSearchSubmit"
          @reset="handleSearchReset"
        />
        <div class="bg-card flex-1 overflow-hidden rounded-lg">
          <VxeGrid
            ref="tableRef"
            class="p-2 pt-0"
            v-bind="gridOptions"
            v-on="gridEvents"
          >
            <template #toolbar-left>
              <div class="text-[16px] font-medium">代码生成列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button type="link" @click="howToUseModalApi.open()">
                  如何使用🤔(beta版)
                </a-button>
                <a-button
                  :disabled="checkedRows.length === 0"
                  danger
                  type="primary"
                  v-access:code="['tool:gen:remove']"
                  @click="handleMultiDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
                <a-button
                  :disabled="checkedRows.length === 0"
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
            <template #loading>
              <Spin :spinning="true" size="large" />
            </template>
          </VxeGrid>
        </div>
      </div>
    </Spin>
    <CodePreviewModal />
    <TableImportModal @reload="() => query()" />
    <HowToUseModal />
  </Page>
</template>
