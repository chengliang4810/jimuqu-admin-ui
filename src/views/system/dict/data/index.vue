<script setup lang="ts">
import type { PageQuery } from '@/api/common';
import type { DictData } from '@/api/system/dict/dict-data-model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import {
  dictDataExport,
  dictDataList,
  dictDataRemove,
} from '@/api/system/dict/dict-data';
import { useVbenDrawer } from '@/components';
import {
  resolveQueryFormValues,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { emitter } from '../mitt';
import { columns } from './data';
import dictDataDrawer from './dict-data-drawer.vue';
import DictDataSearchForm from './dict-data-search.vue';

const dictType = ref('');

const searchFormRef = ref<InstanceType<typeof DictDataSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<DictData>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    // trigger: 'row',
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
          const params: PageQuery = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...values,
          };
          if (dictType.value) {
            params.dictType = dictType.value;
          }

          return await dictDataList(params);
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'dictCode',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-dict-data-index',
});

const tableRef = useTemplateRef<VxeGridInstance<DictData>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<DictData[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const [DictDataDrawer, drawerApi] = useVbenDrawer({
  connectedComponent: dictDataDrawer,
});

function handleAdd() {
  drawerApi.setData({ dictType: dictType.value });
  drawerApi.open();
}

async function handleEdit(record: DictData) {
  drawerApi.setData({
    dictType: dictType.value,
    dictCode: record.dictCode,
  });
  drawerApi.open();
}

async function handleDelete(row: DictData) {
  await dictDataRemove([row.dictCode]);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: DictData) => row.dictCode);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await dictDataRemove(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(dictDataExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues: PageQuery = (await searchFormRef.value?.getValues()) ?? {};
  formValues.dictType = dictType.value;
  // 文件名
  const fileName = buildExportFileName('字典数据');
  exportBlob({ data: formValues, fileName });
}

onMounted(() => {
  emitter.on('rowClick', async (value) => {
    dictType.value = value;
    await query();
  });
  emitter.on('reset', async () => {
    dictType.value = '';
    await reload();
  });
});
onBeforeUnmount(() => {
  emitter.off('rowClick');
  emitter.off('reset');
});

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  searchFormRef.value?.resetFields();
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
  ] as DictData[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}
</script>

<template>
  <Spin
    :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
    :spinning="tableLoading"
    size="large"
    :delay="300"
  >
    <div class="flex h-full flex-col gap-4">
      <DictDataSearchForm
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
            <div class="text-[16px] font-medium">字典数据列表</div>
          </template>
          <template #toolbar-right>
            <Space>
              <a-button
                v-access:code="['system:dict:export']"
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
                v-access:code="['system:dict:remove']"
                @click="handleMultiDelete"
              >
                {{ $t('pages.common.delete') }}
              </a-button>
              <a-button
                :disabled="dictType === ''"
                type="primary"
                v-access:code="['system:dict:add']"
                @click="handleAdd"
              >
                {{ $t('pages.common.add') }}
              </a-button>
            </Space>
          </template>
          <template #action="{ row }">
            <Space>
              <action-button
                v-access:code="['system:dict:edit']"
                @click="handleEdit(row)"
              >
                {{ $t('pages.common.edit') }}
              </action-button>
              <!-- 这里数据会不一致 必须加key标识 -->
              <Popconfirm
                :key="row.dictCode"
                placement="left"
                title="确认删除？"
                @confirm="handleDelete(row)"
              >
                <action-button
                  danger
                  v-access:code="['system:dict:remove']"
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
      <DictDataDrawer @reload="() => query()" />
    </div>
  </Spin>
</template>
