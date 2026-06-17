<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { OssConfig } from '@/api/system/oss-config/model';
import type { SwitchProps } from 'antdv-next';

import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import {
  ossConfigChangeStatus,
  ossConfigList,
  ossConfigRemove,
} from '@/api/system/oss-config';
import { ApiSwitch } from '@/components/global';
import { YesNo } from '@/constants';
import { useAccess } from '@/effects/access';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { Popconfirm, Space, Spin } from 'antdv-next';

import { columns } from './data';
import ossConfigDrawer from './oss-config-drawer.vue';
import OssConfigSearchForm from './oss-config-search.vue';

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
  id: 'system-oss-config-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

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
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: OssConfig) => row.ossConfigId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await ossConfigRemove(ids);
      await tableApi.query();
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
          <OssConfigSearchForm
            @submit="handleSearchSubmit"
            @reset="handleSearchReset"
          />
        <div class="flex-1">
          <BasicTable table-title="oss配置列表">
      <template #toolbar-tools>
        <Space>
          <a-button
            :disabled="!vxeCheckboxChecked(tableApi)"
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
          @reload="tableApi.query()"
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
    </BasicTable>
      </div>
    </div>
    </Spin>
    <OssConfigDrawer @reload="tableApi.query()" />
  </Page>
</template>
