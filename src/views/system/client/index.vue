<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { Client } from '@/api/system/client/model';
import type { SwitchProps } from 'antdv-next';

import { ref } from 'vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import {
  clientChangeStatus,
  clientExport,
  clientList,
  clientRemove,
} from '@/api/system/client';
import { ApiSwitch } from '@/components/global';
import { DEFAULT_CLIENT_ID, EnableStatus } from '@/constants';
import { useAccess } from '@/effects/access';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space, Spin } from 'antdv-next';

import clientDrawer from './client-drawer.vue';
import { columns } from './data';
import ClientSearchForm from './client-search.vue';

const searchFormRef = ref<InstanceType<typeof ClientSearchForm>>();

const tableLoading = ref(false);

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    // trigger: 'row',
    checkMethod: ({ row }) => (row as Client)?.id !== DEFAULT_CLIENT_ID,
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
          return await clientList({
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
  id: 'system-client-index',
  showOverflow: false,
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

const [ClientDrawer, drawerApi] = useVbenDrawer({
  connectedComponent: clientDrawer,
});

function handleAdd() {
  drawerApi.setData({});
  drawerApi.open();
}

async function handleEdit(record: Client) {
  drawerApi.setData({ id: record.id });
  drawerApi.open();
}

async function handleDelete(row: Client) {
  await clientRemove([row.id]);
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: Client) => row.id);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await clientRemove(ids);
      await tableApi.query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(clientExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = (await searchFormRef.value?.getValues()) ?? {};
  // 文件名
  const fileName = buildExportFileName('客户端数据');
  exportBlob({ data: formValues, fileName });
}

const { hasAccessByCodes } = useAccess();
async function handleChangeStatus(
  checked: SwitchProps['checked'],
  row: Client,
) {
  await clientChangeStatus({
    clientId: row.id,
    status: checked ? EnableStatus.Enable : EnableStatus.Disable,
  });
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
    <Spin
      :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
      :spinning="tableLoading"
      size="large"
      :delay="300"
    >
      <div class="flex h-full flex-col gap-4">
        <ClientSearchForm
          ref="searchFormRef"
          @submit="handleSearchSubmit"
          @reset="handleSearchReset"
        />
        <div class="flex-1">
          <BasicTable table-title="客户端列表">
      <template #toolbar-tools>
        <Space>
          <a-button
            v-access:code="['system:client:export']"
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
            v-access:code="['system:client:remove']"
            @click="handleMultiDelete"
          >
            {{ $t('pages.common.delete') }}
          </a-button>
          <a-button
            type="primary"
            v-access:code="['system:client:add']"
            @click="handleAdd"
          >
            {{ $t('pages.common.add') }}
          </a-button>
        </Space>
      </template>
      <template #status="{ row }">
        <!-- pc不允许禁用 禁用了直接登录不了 应该设置disabled -->
        <!-- 登录提示: 认证权限类型已禁用 -->
        <ApiSwitch
          :value="row.status === EnableStatus.Enable"
          :api="(checked) => handleChangeStatus(checked, row)"
          :disabled="
            row.id === DEFAULT_CLIENT_ID ||
            !hasAccessByCodes(['system:client:edit'])
          "
          @reload="tableApi.query()"
        />
      </template>
      <template #action="{ row }">
        <Space>
          <action-button
            v-access:code="['system:client:edit']"
            @click.stop="handleEdit(row)"
          >
            {{ $t('pages.common.edit') }}
          </action-button>
          <Popconfirm
            :disabled="row.id === 1"
            placement="left"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <action-button
              :disabled="row.id === 1"
              danger
              v-access:code="['system:client:remove']"
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
    </Spin>
    <ClientDrawer @reload="tableApi.query()" />
  </Page>
</template>
