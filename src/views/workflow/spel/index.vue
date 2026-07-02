<script setup lang="ts">
import type { Spel } from '@/api/workflow/spel/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import { spelDelete, spelList } from '@/api/workflow/spel';
import { Page, useVbenModal } from '@/components';
import {
  resolveQueryFormValues,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import spelModal from './spel-modal.vue';
import SpelSearchForm from './spel-search.vue';

const searchFormRef = ref<InstanceType<typeof SpelSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Spel>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
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
          return await spelList({
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
    keyField: 'id',
  },
  id: 'workflow-spel-index',
  showOverflow: false,
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<Spel>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<Spel[]>([]);

const [SpelModal, modalApi] = useVbenModal({
  connectedComponent: spelModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleEdit(record: Spel) {
  modalApi.setData({ id: record.id });
  modalApi.open();
}

async function handleDelete(row: Spel) {
  await spelDelete([row.id]);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: Spel) => row.id);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await spelDelete(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
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
  ] as Spel[];
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
        <SpelSearchForm
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
              <div class="text-[16px] font-medium">流程SpEL表达式</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button
                  :disabled="checkedRows.length === 0"
                  danger
                  type="primary"
                  v-access:code="['system:config:remove']"
                  @click="handleMultiDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
                <a-button
                  type="primary"
                  v-access:code="['system:config:add']"
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
                    danger
                    v-access:code="['system:config:remove']"
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
        <SpelModal @reload="() => query()" />
      </div>
    </Spin>
  </Page>
</template>
