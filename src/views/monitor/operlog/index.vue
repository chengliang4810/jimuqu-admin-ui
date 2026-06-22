<script setup lang="ts">
import type { PageQuery } from '@/api/common';
import type { OperationLog } from '@/api/monitor/operlog/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  operLogClean,
  operLogDelete,
  operLogExport,
  operLogList,
} from '@/api/monitor/operlog';
import {
  addSortParams,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { $t } from '@/locales';
import { useBlobExport } from '@/utils/file/export';
import { confirmDeleteModal } from '@/utils/modal';
import { Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import operationPreviewDrawer from './operation-preview-drawer.vue';
import OperlogSearchForm from './operlog-search.vue';

const searchFormRef = ref<InstanceType<typeof OperlogSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<OperationLog>({
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
      query: async ({ page, sorts }, formValues = {}) => {
        tableLoading.value = true;
        try {
          const params: PageQuery = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          // 添加排序参数
          addSortParams(params, sorts);
          return await operLogList(params);
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'operId',
  },
  sortConfig: {
    // 远程排序
    remote: true,
    // 支持多字段排序 默认关闭
    multiple: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'monitor-operlog-index',
});

const tableRef = useTemplateRef<VxeGridInstance<OperationLog>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<OperationLog[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
  // 排序 重新请求接口
  sortChange: () => query(),
};

const [OperationPreviewDrawer, drawerApi] = useVbenDrawer({
  connectedComponent: operationPreviewDrawer,
});

/**
 * 预览
 * @param record 操作日志记录
 */
function handlePreview(record: OperationLog) {
  drawerApi.setData({ record });
  drawerApi.open();
}

/**
 * 清空全部日志
 */
function handleClear() {
  confirmDeleteModal({
    onValidated: async () => {
      await operLogClean();
      await reload();
    },
  });
}
/**
 * 删除日志
 */
async function handleDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: OperationLog) => row.operId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条操作日志吗？`,
    onOk: async () => {
      await operLogDelete(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(operLogExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = (await searchFormRef.value?.getValues()) ?? {};
  // 文件名
  const fileName = buildExportFileName('操作日志');
  exportBlob({ data: formValues, fileName });
}

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  reload();
}

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as OperationLog[];
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
        <OperlogSearchForm
          ref="searchFormRef"
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
              <div class="text-[16px] font-medium">操作日志列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button
                  v-access:code="['monitor:operlog:remove']"
                  @click="handleClear"
                >
                  {{ $t('pages.common.clear') }}
                </a-button>
                <a-button
                  v-access:code="['monitor:operlog:export']"
                  :loading="exportLoading"
                  :disabled="exportLoading"
                  @click="handleExport"
                >
                  {{ $t('pages.common.export') }}
                </a-button>
                <a-button
                  :disabled="checkedRows.length === 0"
                  danger
                  type="primary"
                  v-access:code="['monitor:operlog:remove']"
                  @click="handleDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
              </Space>
            </template>
            <template #action="{ row }">
              <action-button
                v-access:code="['monitor:operlog:list']"
                @click.stop="handlePreview(row)"
              >
                {{ $t('pages.common.preview') }}
              </action-button>
            </template>
            <template #loading>
              <Spin :spinning="true" size="large" />
            </template>
          </VxeGrid>
        </div>
      </div>
    </Spin>
    <OperationPreviewDrawer />
  </Page>
</template>
