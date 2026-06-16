<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { SysConfig } from '@/api/system/config/model';

import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import {
  configExport,
  configList,
  configRefreshCache,
  configRemove,
} from '@/api/system/config';
import { YesNo } from '@/constants';
import { Page, useVbenModal } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space } from 'antdv-next';

import configModal from './config-modal.vue';
import ConfigSearchForm from './config-search.vue';
import { columns } from './data';

const gridOptions: VxeGridProps = {
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
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await configList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'configId',
  },
  id: 'system-config-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});
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
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: SysConfig) => row.configId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await configRemove(ids);
      await tableApi.query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(configExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = await tableApi.formApi.getValues();
  // 文件名
  const fileName = buildExportFileName('参数配置');
  exportBlob({ data: formValues, fileName });
}

async function handleRefreshCache() {
  await configRefreshCache();
  await tableApi.query();
}

function handleSearchSubmit(data: Record<string, any>) {
  tableApi.reload(data);
}

function handleSearchReset() {
  tableApi.reload();
}
</script>

<template>
  <Page :auto-content-height="true">
    <!-- 外层auto-content-height已经占满了内容高度 -->
    <div class="flex h-full flex-col gap-4">
      <ConfigSearchForm
        @submit="handleSearchSubmit"
        @reset="handleSearchReset"
      />

      <!-- 这里占满剩余高度 -->
      <div class="flex-1">
        <!-- 这里拿到的就是最终的剩余高度 -->
        <BasicTable table-title="参数列表">
          <template #toolbar-tools>
            <Space>
              <a-button @click="handleRefreshCache"> 刷新缓存 </a-button>
              <a-button
                v-access:code="['system:config:export']"
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
        </BasicTable>
      </div>
    </div>

    <ConfigModal @reload="tableApi.query()" />
  </Page>
</template>
