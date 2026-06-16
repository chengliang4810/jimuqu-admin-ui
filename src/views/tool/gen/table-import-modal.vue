<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';

import { ref } from 'vue';

import { useVbenVxeGrid } from '@/adapter/vxe-table';
import {
  getDataSourceNames,
  importTable,
  readyToGenList,
} from '@/api/tool/gen';
import { useVbenModal } from '@/effects/common-ui';
import TableImportSearchForm from './table-import-search.vue';

const emit = defineEmits<{ reload: [] }>();

const searchFormRef = ref<InstanceType<typeof TableImportSearchForm>>();
const dataSourceOptions = ref<{ label: string; value: string }[]>([]);

const gridOptions: VxeGridProps = {
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
};

const [BasicTable, tableApi] = useVbenVxeGrid({ gridOptions });

const [BasicModal, modalApi] = useVbenModal({
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      tableApi.grid.clearCheckboxRow();
      return null;
    }
    const ret = await getDataSourceNames();
    const options = ret.map((item) => ({ label: item, value: item }));
    dataSourceOptions.value = options;
  },
  onConfirm: handleSubmit,
});

function handleSearchSubmit(data: Record<string, any>) {
  tableApi.reload(data);
}

function handleSearchReset() {
  tableApi.reload();
}

async function handleSubmit() {
  try {
    const records = tableApi.grid.getCheckboxRecords();
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
      <div class="flex-1">
        <BasicTable />
      </div>
    </div>
  </BasicModal>
</template>
