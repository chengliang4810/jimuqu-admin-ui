<script setup lang="ts">
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  getDataSourceNames,
  importTable,
  readyToGenList,
} from '@/api/tool/gen';
import { useVbenModal } from '@/components';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import TableImportSearchForm from './table-import-search.vue';

interface ImportTableRow {
  tableName: string;
  tableComment?: string;
  createTime?: string;
  updateTime?: string;
  [key: string]: any;
}

const emit = defineEmits<{ reload: [] }>();

const searchFormRef = ref<InstanceType<typeof TableImportSearchForm>>();
const dataSourceOptions = ref<{ label: string; value: string }[]>([]);

const gridOptions = withDefaultVxeGridOptions<ImportTableRow>({
  checkboxConfig: {
    highlight: true,
    reserve: true,
    trigger: 'row',
  },
  columns: [
    {
      type: 'checkbox',
      width: 45,
      align: 'center',
      resizable: false,
    },
    {
      title: '表名称',
      field: 'tableName',
      headerAlign: 'center',
      align: 'left',
      minWidth: 180,
      showOverflow: true,
    },
    {
      title: '表描述',
      field: 'tableComment',
      headerAlign: 'center',
      align: 'left',
      minWidth: 210,
      showOverflow: true,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 150,
      align: 'center',
      resizable: false,
    },
    {
      title: '更新时间',
      field: 'updateTime',
      width: 150,
      align: 'center',
      resizable: false,
    },
  ],
  keepSource: true,
  size: 'small',
  minHeight: 600,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return readyToGenList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'tableName',
  },
  toolbarConfig: {
    enabled: false,
  },
  id: 'import-table-modal',
  cellClassName: 'cursor-pointer',
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<ImportTableRow>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<ImportTableRow[]>([]);

const [BasicModal, modalApi] = useVbenModal({
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      tableRef.value?.clearCheckboxRow();
      return null;
    }
    const ret = await getDataSourceNames();
    const options = ret.map((item) => ({ label: item, value: item }));
    dataSourceOptions.value = options;
  },
  onConfirm: handleSubmit,
});

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  reload();
}

async function handleSubmit() {
  try {
    const records = getCheckedRows();
    const tables = records.map((item) => item.tableName);
    if (tables.length === 0) {
      await modalApi.close();
      return;
    }
    modalApi.modalLoading(true);
    const formValues = (await searchFormRef.value?.getValues()) ?? {};
    const dataName = formValues.dataName || 'master';
    await importTable(tables.join(','), dataName);
    emit('reload');
    await modalApi.close();
  } catch (error) {
    console.warn(error);
  } finally {
    modalApi.modalLoading(false);
  }
}

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as ImportTableRow[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}
</script>

<template>
  <BasicModal :width="900" title="导入表">
    <div class="flex h-full flex-col gap-4">
      <TableImportSearchForm
        ref="searchFormRef"
        :data-source-options="dataSourceOptions"
        @submit="handleSearchSubmit"
        @reset="handleSearchReset"
      />
      <div class="bg-card flex-1 rounded-lg">
        <VxeGrid
          ref="tableRef"
          class="p-2 pt-0"
          v-bind="gridOptions"
          v-on="gridEvents"
        >
          <template #loading>
            <Spin :spinning="true" size="large" />
          </template>
        </VxeGrid>
      </div>
    </div>
  </BasicModal>
</template>
