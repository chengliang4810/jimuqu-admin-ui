<script setup lang="ts">
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import { readyToGenList, getDataSourceNames, importTable } from '@/api/tool/gen';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { useVbenModal } from '@/effects/common-ui';
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
      width: 60,
    },
    {
      title: '表名称',
      field: 'tableName',
      align: 'left',
    },
    {
      title: '表描述',
      field: 'tableComment',
      align: 'left',
    },
    {
      title: '创建时间',
      field: 'createTime',
    },
    {
      title: '更新时间',
      field: 'updateTime',
    },
  ],
  keepSource: true,
  size: 'small',
  minHeight: 400,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await readyToGenList({
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
      modalApi.close();
      return;
    }
    modalApi.modalLoading(true);
    const formValues = (await searchFormRef.value?.getValues()) ?? {};
    const dataName = formValues.dataName || 'master';
    await importTable(tables.join(','), dataName);
    emit('reload');
    modalApi.close();
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
  <BasicModal :width="800" title="导入表">
    <div class="flex h-full flex-col gap-4">
      <TableImportSearchForm
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
          <template #loading>
            <Spin :spinning="true" size="large" />
          </template>
        </VxeGrid>
      </div>
    </div>
  </BasicModal>
</template>
