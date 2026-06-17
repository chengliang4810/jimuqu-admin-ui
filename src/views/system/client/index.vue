<script setup lang="ts">
import type { Client } from '@/api/system/client/model';
import type { SwitchProps } from 'antdv-next';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  clientChangeStatus,
  clientExport,
  clientList,
  clientRemove,
} from '@/api/system/client';
import { ApiSwitch } from '@/components/global';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { DEFAULT_CLIENT_ID, EnableStatus } from '@/constants';
import { useAccess } from '@/effects/access';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import clientDrawer from './client-drawer.vue';
import { columns } from './data';
import ClientSearchForm from './client-search.vue';

const searchFormRef = ref<InstanceType<typeof ClientSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Client>({
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
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-client-index',
  showOverflow: false,
});

const tableRef = useTemplateRef<VxeGridInstance<Client>>('tableRef');
const { query, reload } = useTableQuery(searchFormRef, tableRef, syncCheckedRows);
const checkedRows = ref<Client[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

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
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: Client) => row.id);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await clientRemove(ids);
      await query();
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
  ] as Client[];
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
        <ClientSearchForm
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
              <div class="text-[16px] font-medium">客户端列表</div>
            </template>
      <template #toolbar-right>
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
            :disabled="checkedRows.length === 0"
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
          @reload="() => query()"
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
      <template #loading>
        <Spin :spinning="true" size="large" />
      </template>
      </VxeGrid>
      </div>
    </div>
    </Spin>
    <ClientDrawer @reload="() => query()" />
  </Page>
</template>
