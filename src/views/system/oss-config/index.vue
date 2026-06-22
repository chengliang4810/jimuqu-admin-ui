<script setup lang="ts">
import type { OssConfig } from '@/api/system/oss-config/model';
import type { SwitchProps } from 'antdv-next';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  ossConfigChangeStatus,
  ossConfigList,
  ossConfigRemove,
} from '@/api/system/oss-config';
import { ApiSwitch } from '@/components/global';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { YesNo } from '@/constants';
import { useAccess } from '@/effects/access';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import ossConfigDrawer from './oss-config-drawer.vue';
import OssConfigSearchForm from './oss-config-search.vue';

const searchFormRef = ref<InstanceType<typeof OssConfigSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<OssConfig>({
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
          return await ossConfigList({
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
    keyField: 'ossConfigId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-oss-config-index',
});

const tableRef = useTemplateRef<VxeGridInstance<OssConfig>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<OssConfig[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const [OssConfigDrawer, drawerApi] = useVbenDrawer({
  connectedComponent: ossConfigDrawer,
});

function handleAdd() {
  drawerApi.setData({});
  drawerApi.open();
}

async function handleEdit(record: OssConfig) {
  drawerApi.setData({ id: record.ossConfigId });
  drawerApi.open();
}

async function handleDelete(row: OssConfig) {
  await ossConfigRemove([row.ossConfigId]);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: OssConfig) => row.ossConfigId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await ossConfigRemove(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const { hasAccessByCodes } = useAccess();
async function handleChangeStatus(
  checked: SwitchProps['checked'],
  row: OssConfig,
) {
  await ossConfigChangeStatus({
    ossConfigId: row.ossConfigId,
    configKey: row.configKey,
    status: checked ? YesNo.Yes : YesNo.No,
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
  ] as OssConfig[];
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
        <OssConfigSearchForm
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
              <div class="text-[16px] font-medium">oss配置列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button
                  :disabled="checkedRows.length === 0"
                  danger
                  type="primary"
                  v-access:code="['system:ossConfig:remove']"
                  @click="handleMultiDelete"
                >
                  {{ $t('pages.common.delete') }}
                </a-button>
                <a-button
                  type="primary"
                  v-access:code="['system:ossConfig:add']"
                  @click="handleAdd"
                >
                  {{ $t('pages.common.add') }}
                </a-button>
              </Space>
            </template>
            <template #status="{ row }">
              <ApiSwitch
                :value="row.status === YesNo.Yes"
                :api="(checked) => handleChangeStatus(checked, row)"
                :disabled="!hasAccessByCodes(['system:ossConfig:edit'])"
                checked-text="是"
                un-checked-text="否"
                @reload="() => query()"
              />
            </template>
            <template #action="{ row }">
              <Space>
                <action-button
                  v-access:code="['system:ossConfig:edit']"
                  @click="handleEdit(row)"
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
                    v-access:code="['system:ossConfig:remove']"
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
    <OssConfigDrawer @reload="() => query()" />
  </Page>
</template>
