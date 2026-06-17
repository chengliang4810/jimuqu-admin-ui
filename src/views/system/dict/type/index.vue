<script setup lang="ts">
import type { DictType } from '@/api/system/dict/dict-type-model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  dictTypeExport,
  dictTypeList,
  dictTypeRemove,
  refreshDictTypeCache,
} from '@/api/system/dict/dict-type';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { useVbenModal } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { emitter } from '../mitt';
import { columns } from './data';
import dictTypeModal from './dict-type-modal.vue';
import DictTypeSearchForm from './dict-type-search.vue';

const searchFormRef = ref<InstanceType<typeof DictTypeSearchForm>>();
const searchParams = ref<Record<string, unknown>>({});

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<DictType>({
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
      query: async ({ page }) => {
        tableLoading.value = true;
        try {
          return await dictTypeList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...searchParams.value,
          });
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'dictId',
    // 高亮当前行
    isCurrent: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-dict-type-index',
  rowClassName: 'hover:cursor-pointer',
});

const lastDictType = ref('');

const tableRef = useTemplateRef<VxeGridInstance<DictType>>('tableRef');
const checkedRows = ref<DictType[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
  cellClick: (e) => {
    const { row } = e;
    if (lastDictType.value === row.dictType) {
      return;
    }
    emitter.emit('rowClick', row.dictType);
    lastDictType.value = row.dictType;
  },
};

const [DictTypeModal, modalApi] = useVbenModal({
  connectedComponent: dictTypeModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleEdit(record: DictType) {
  modalApi.setData({ id: record.dictId });
  modalApi.open();
}

async function handleDelete(row: DictType) {
  await dictTypeRemove([row.dictId]);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: DictType) => row.dictId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await dictTypeRemove(ids);
      await query();
    },
  });
}

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  emitter.emit('reset');
  reload();
}

async function handleRefreshCache() {
  await refreshDictTypeCache();
  await query();
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(dictTypeExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = searchFormRef.value?.getValues() ?? {};
  // 文件名
  const fileName = buildExportFileName('字典类型数据');
  exportBlob({ data: formValues, fileName });
}

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as DictType[];
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
  <Spin
    :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
    :spinning="tableLoading"
    size="large"
    :delay="300"
  >
    <div class="flex h-full flex-col gap-4">
      <DictTypeSearchForm
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
            <div class="text-[16px] font-medium">字典类型列表</div>
          </template>
        <template #toolbar-right>
          <Space>
            <a-button
              v-access:code="['system:dict:edit']"
              @click="handleRefreshCache"
            >
              刷新缓存
            </a-button>
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
    <DictTypeModal @reload="() => query()" />
  </div>
  </Spin>
</template>

<style lang="scss">
div#dict-type {
  .vxe-body--row {
    &.row--current {
      // 选中行bold
      @apply font-semibold;
    }
  }
}
</style>
