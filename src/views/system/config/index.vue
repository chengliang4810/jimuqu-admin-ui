<script setup lang="ts">
import type { SysConfig } from '@/api/system/config/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  configExport,
  configList,
  configRefreshCache,
  configRemove,
} from '@/api/system/config';
import { Page, useVbenModal } from '@/components';
import {
  resolveQueryFormValues,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { YesNo } from '@/constants';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import configModal from './config-modal.vue';
import ConfigSearchForm from './config-search.vue';
import { columns } from './data';

const gridOptions = withDefaultVxeGridOptions<SysConfig>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    checkMethod: ({ row }) => row.configType === YesNo.No,
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    showLoading: false,
    ajax: {
      query: async ({ page }, formValues) => {
        const values = await resolveQueryFormValues(searchFormRef, formValues);
        tableLoading.value = true;
        try {
          return await configList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...values,
          });
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'configId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-config-index',
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<SysConfig>>('tableRef');
const searchFormRef = ref<InstanceType<typeof ConfigSearchForm>>();
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<SysConfig[]>([]);
const tableLoading = ref(false);

const [ConfigModal, modalApi] = useVbenModal({
  connectedComponent: configModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleEdit(record: SysConfig) {
  modalApi.setData({ id: record.configId });
  modalApi.open();
}

async function handleDelete(row: SysConfig) {
  await configRemove([row.configId]);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: SysConfig) => row.configId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await configRemove(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(configExport);
async function handleExport() {
  const formValues = (await searchFormRef.value?.getValues()) ?? {};
  const fileName = buildExportFileName('参数数据');
  exportBlob({ data: formValues, fileName });
}

async function handleRefreshCache() {
  await configRefreshCache();
  await query();
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
  ] as SysConfig[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}
</script>

<template>
  <Page :auto-content-height="true">
    <!-- 外层auto-content-height已经占满了内容高度 -->
    <Spin
      :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
      :spinning="tableLoading"
      size="large"
      :delay="300"
    >
      <div class="flex h-full flex-col gap-4">
        <ConfigSearchForm
          ref="searchFormRef"
          @submit="handleSearchSubmit"
          @reset="handleSearchReset"
        />

        <!-- 这里占满剩余高度 overflow-hidden保证搜索/展开导致高度变化 这里能正常 -->
        <div class="bg-card flex-1 overflow-hidden rounded-lg">
          <VxeGrid
            ref="tableRef"
            class="p-2 pt-0"
            v-bind="gridOptions"
            v-on="gridEvents"
          >
            <template #toolbar-left>
              <div class="text-[16px] font-medium">参数列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button
                  v-access:code="['system:config:export']"
                  :loading="exportLoading"
                  :disabled="exportLoading"
                  @click="handleExport"
                >
                  {{ $t('pages.common.export') }}
                </a-button>
                <Popconfirm
                  title="确认刷新参数缓存？"
                  @confirm="handleRefreshCache"
                >
                  <a-button v-access:code="['system:config:remove']">
                    刷新缓存
                  </a-button>
                </Popconfirm>
                <a-button
                  v-access:code="['system:config:remove']"
                  :disabled="checkedRows.length === 0"
                  danger
                  type="primary"
                  @click="handleMultiDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
                <a-button
                  v-access:code="['system:config:add']"
                  type="primary"
                  @click="handleAdd"
                >
                  {{ $t('pages.common.add') }}
                </a-button>
              </Space>
            </template>

            <template #action="{ row }">
              <Space>
                <action-button
                  v-access:code="['system:config:edit']"
                  @click.stop="handleEdit(row)"
                >
                  {{ $t('pages.common.edit') }}
                </action-button>
                <Popconfirm
                  placement="left"
                  title="确认删除？"
                  @confirm="handleDelete(row)"
                >
                  <action-button
                    :disabled="row.configType === YesNo.Yes"
                    v-access:code="['system:config:remove']"
                    danger
                    @click.stop=""
                  >
                    {{ $t('pages.common.delete') }}
                  </action-button>
                </Popconfirm>
              </Space>
            </template>

            <template #loading>
              <Spin :spinning="true" size="large" />
            </template>
          </VxeGrid>
        </div>
      </div>
    </Spin>

    <ConfigModal @reload="() => query()" />
  </Page>
</template>
