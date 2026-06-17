<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { PageQuery } from '@/api/common';
import type { DictData } from '@/api/system/dict/dict-data-model';

import { onBeforeUnmount, onMounted, ref } from 'vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import {
  dictDataExport,
  dictDataList,
  dictDataRemove,
} from '@/api/system/dict/dict-data';
import { useVbenDrawer } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space, Spin } from 'antdv-next';

import { emitter } from '../mitt';
import { columns } from './data';
import dictDataDrawer from './dict-data-drawer.vue';
import DictDataSearchForm from './dict-data-search.vue';

const dictType = ref('');

const searchFormRef = ref<InstanceType<typeof DictDataSearchForm>>();

const tableLoading = ref(false);

const gridOptions: VxeGridProps = {
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
      query: async ({ page }, formValues = {}) => {
        tableLoading.value = true;
        try {
          const params: PageQuery = {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
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
  id: 'system-dict-data-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

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
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: DictData) => row.dictCode);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await dictDataRemove(ids);
      await tableApi.query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(dictDataExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = searchFormRef.value?.getValues() ?? {};
  formValues.dictType = dictType.value;
  // 文件名
  const fileName = buildExportFileName('字典数据');
  exportBlob({ data: formValues, fileName });
}

onMounted(() => {
  emitter.on('rowClick', async (value) => {
    dictType.value = value;
    await tableApi.query();
  });
  emitter.on('reset', async () => {
    dictType.value = '';
    await tableApi.reload();
  });
});
onBeforeUnmount(() => {
  emitter.off('rowClick');
  emitter.off('reset');
});

function handleSearchSubmit(data: Record<string, any>) {
  tableApi.reload(data);
}

function handleSearchReset() {
  searchFormRef.value?.resetFields();
  tableApi.reload();
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
      <div class="flex-1">
        <BasicTable table-title="字典数据列表">
        <template #toolbar-tools>
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
              :disabled="!vxeCheckboxChecked(tableApi)"
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
      </BasicTable>
    </div>
    <DictDataDrawer @reload="tableApi.query()" />
  </div>
  </Spin>
</template>
