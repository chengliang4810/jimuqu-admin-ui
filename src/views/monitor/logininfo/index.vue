<script setup lang="ts">
import type { LoginLog } from '@/api/monitor/logininfo/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  loginInfoClean,
  loginInfoExport,
  loginInfoList,
  loginInfoRemove,
  userUnlock,
} from '@/api/monitor/logininfo';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenModal } from '@/components';
import { useBlobExport } from '@/utils/file/export';
import { confirmDeleteModal } from '@/utils/modal';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import loginInfoModal from './login-info-modal.vue';
import LogininfoSearchForm from './logininfo-search.vue';

const searchFormRef = ref<InstanceType<typeof LogininfoSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<LoginLog>({
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
          return await loginInfoList({
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
    keyField: 'infoId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'monitor-logininfo-index',
});

const canUnlock = ref(false);
const tableRef = useTemplateRef<VxeGridInstance<LoginLog>>('tableRef');
const checkedRows = ref<LoginLog[]>([]);

const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: (e) => {
    syncCheckedRows();
    const records = e.$grid?.getCheckboxRecords?.() ?? [];
    canUnlock.value = records.length === 1 && records[0]!.status === '1';
  },
};

const [LoginInfoModal, modalApi] = useVbenModal({
  connectedComponent: loginInfoModal,
});

function handlePreview(record: LoginLog) {
  modalApi.setData(record);
  modalApi.open();
}

function handleClear() {
  confirmDeleteModal({
    onValidated: async () => {
      await loginInfoClean();
      await reload();
    },
  });
}

async function handleDelete(row: LoginLog) {
  await loginInfoRemove([row.infoId]);
  // 取消该行选中状态，避免 reserve 记录残留导致顶部按钮状态错误
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: LoginLog) => row.infoId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await loginInfoRemove(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

async function handleUnlock() {
  const records = getCheckedRows();
  if (records.length !== 1) {
    return;
  }
  const { userName } = records[0]!;
  await userUnlock(userName);
  await query();
  canUnlock.value = false;
  tableRef.value?.clearCheckboxRow();
  tableRef.value?.clearCheckboxReserve();
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(loginInfoExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = searchFormRef.value?.getValues() ?? {};
  // 文件名
  const fileName = buildExportFileName('登录日志');
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
  ] as LoginLog[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}
</script>

<template>
  <Page auto-content-height>
    <Spin
      :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
      :spinning="tableLoading"
      size="large"
      :delay="300"
    >
      <div class="flex h-full flex-col gap-4">
        <LogininfoSearchForm
          ref="searchFormRef"
          @reset="handleSearchReset"
          @submit="handleSearchSubmit"
        />
        <div class="bg-card flex-1 overflow-hidden rounded-lg">
          <VxeGrid
            ref="tableRef"
            class="p-2 pt-0"
            v-bind="gridOptions"
            v-on="gridEvents"
          >
            <template #toolbar-left>
              <div class="text-[16px] font-medium">登录日志列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button
                  v-access:code="['monitor:logininfor:remove']"
                  @click="handleClear"
                >
                  {{ $t('pages.common.clear') }}
                </a-button>
                <a-button
                  v-access:code="['monitor:logininfor:export']"
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
                  v-access:code="['monitor:logininfor:remove']"
                  @click="handleMultiDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
                <a-button
                  :disabled="!canUnlock"
                  color="green"
                  variant="solid"
                  type="primary"
                  v-access:code="['monitor:logininfor:unlock']"
                  @click="handleUnlock"
                >
                  {{ $t('pages.common.unlock') }}
                </a-button>
              </Space>
            </template>
            <template #action="{ row }">
              <Space>
                <action-button @click.stop="handlePreview(row)">
                  {{ $t('pages.common.info') }}
                </action-button>
                <Popconfirm
                  placement="left"
                  title="确认删除?"
                  @confirm="() => handleDelete(row)"
                >
                  <action-button
                    danger
                    v-access:code="['monitor:logininfor:remove']"
                    @click.stop=""
                  >
                    {{ $t('pages.common.delete') }}
                  </action-button>
                </Popconfirm>
              </Space>
            </template>
          </VxeGrid>
        </div>
      </div>
    </Spin>
    <LoginInfoModal />
  </Page>
</template>
