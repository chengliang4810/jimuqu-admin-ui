<script setup lang="ts">
import type { LeaveForm } from './api/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import { cancelProcessApply } from '@/api/workflow/instance';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { Page, useVbenDrawer, useVbenModal } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { applyModal, flowInfoModal } from '../components';
import { leaveExport, leaveList, leaveRemove } from './api';
import { columns } from './data';
import LeaveSearchForm from './leave-search.vue';
import { useRouteIdEdit } from './hook';
import leaveDrawer from './leave-drawer.vue';

const searchFormRef = ref<InstanceType<typeof LeaveSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Required<LeaveForm>>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 选中 需要根据状态判断
    checkMethod: ({ row }) =>
      ['back', 'cancel', 'draft'].includes(row.status),
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
          return await leaveList({
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
    keyField: 'id',
  },
  // 表格全局唯一表示 保存列配置需要用到
  id: 'workflow-leave-index',
  cellClassName: ({ row }) => {
    // 草稿状态 可点击
    if (row.status !== 'draft') {
      return 'cursor-pointer';
    }
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
});

const gridEvents: VxeGridListeners = {
  cellClick: ({ row, column }) => {
    // 草稿状态 不做处理
    // 操作列 不做处理
    if (row.status === 'draft' || column.field === 'action') {
      return;
    }
    // 查看详情
    handleInfo(row);
  },
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<Required<LeaveForm>>>('tableRef');
const checkedRows = ref<Required<LeaveForm>[]>([]);

const [ApplyModal, applyModalApi] = useVbenModal({
  connectedComponent: applyModal,
});
const [LeaveDrawer, leaveDrawerApi] = useVbenDrawer({
  connectedComponent: leaveDrawer,
});

function handleAdd() {
  leaveDrawerApi.setData({ applyModalApi }).open();
}

async function handleEdit(row: Required<LeaveForm>) {
  leaveDrawerApi.setData({ id: row.id, applyModalApi }).open();
}

useRouteIdEdit((id) => {
  // 打开编辑
  leaveDrawerApi.setData({ id, applyModalApi }).open();
});

async function handleCompleteOrCancel() {
  leaveDrawerApi.close();
  query();
}

async function handleDelete(row: Required<LeaveForm>) {
  await leaveRemove(row.id);
  await query();
}

async function handleRevoke(row: Required<LeaveForm>) {
  await cancelProcessApply({
    businessId: row.id,
    message: '申请人撤销流程！',
  });
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: Required<LeaveForm>) => row.id);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await leaveRemove(ids);
      await query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(leaveExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = searchFormRef.value?.getValues() ?? {};
  // 文件名
  const fileName = buildExportFileName('请假申请数据');
  exportBlob({ data: formValues, fileName });
}

const [FlowInfoModal, flowInfoModalApi] = useVbenModal({
  connectedComponent: flowInfoModal,
});

function handleInfo(row: Required<LeaveForm>) {
  flowInfoModalApi.setData({ businessId: row.id });
  flowInfoModalApi.open();
}

async function handleSearch() {
  const values = searchFormRef.value?.getValues() ?? {};
  await query(values);
}

function handleReset() {
  searchFormRef.value?.reset?.();
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
  ] as Required<LeaveForm>[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}

async function query(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('query', params);
  syncCheckedRows();
}

async function reload(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('reload', params);
  syncCheckedRows();
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
        <LeaveSearchForm
          ref="searchFormRef"
          @search="handleSearch"
          @reset="handleReset"
        />
        <div class="bg-card flex-1 overflow-hidden rounded-lg">
          <VxeGrid
            ref="tableRef"
            class="p-2 pt-0"
            v-bind="gridOptions"
            v-on="gridEvents"
          >
            <template #toolbar-left>
              <div class="text-[16px] font-medium">请假申请列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button
                  v-access:code="['workflow:leave:export']"
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
                  v-access:code="['workflow:leave:remove']"
                  @click="handleMultiDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
                <a-button
                  type="primary"
                  v-access:code="['workflow:leave:add']"
                  @click="handleAdd"
                >
                  {{ $t('pages.common.add') }}
                </a-button>
              </Space>
            </template>
            <template #action="{ row }">
              <a-button
                size="small"
                type="link"
                :disabled="!['draft', 'cancel', 'back'].includes(row.status)"
                v-access:code="['workflow:leave:edit']"
                @click.stop="handleEdit(row)"
              >
                {{ $t('pages.common.edit') }}
              </a-button>
              <Popconfirm
                placement="left"
                title="确认撤销？"
                :disabled="!['waiting'].includes(row.status)"
                @confirm.stop="handleRevoke(row)"
                @cancel.stop=""
              >
                <a-button
                  size="small"
                  type="link"
                  :disabled="!['waiting'].includes(row.status)"
                  v-access:code="['workflow:leave:edit']"
                  @click.stop=""
                >
                  撤销
                </a-button>
              </Popconfirm>
              <Popconfirm
                placement="left"
                title="确认删除？"
                :disabled="!['draft', 'cancel', 'back'].includes(row.status)"
                @confirm.stop="handleDelete(row)"
                @cancel.stop=""
              >
                <a-button
                  size="small"
                  type="link"
                  :disabled="!['draft', 'cancel', 'back'].includes(row.status)"
                  danger
                  v-access:code="['workflow:leave:remove']"
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
    <FlowInfoModal />
    <ApplyModal
      @complete="handleCompleteOrCancel"
      @cancel="handleCompleteOrCancel"
    />
    <LeaveDrawer @reload="() => query()" />
  </Page>
</template>
