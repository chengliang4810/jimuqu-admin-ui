<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { User } from '@/api/system/user/model';
import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import {
  roleAllocatedList,
  roleAuthCancel,
  roleAuthCancelAll,
} from '@/api/system/role';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { Popconfirm, Space, Spin } from 'antdv-next';

import { columns } from './data';
import roleAssignDrawer from './role-assign-drawer.vue';
import RoleAssignSearchForm from './role-assign-search.vue';

const route = useRoute();
const roleId = route.params.roleId as string;

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
          return await roleAllocatedList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            roleId,
            ...formValues,
          });
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'userId',
  },
  id: 'system-role-assign-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

const [RoleAssignDrawer, drawerApi] = useVbenDrawer({
  connectedComponent: roleAssignDrawer,
});

function handleAdd() {
  drawerApi.setData({});
  drawerApi.open();
}

/**
 * 取消授权 一条记录
 */
async function handleAuthCancel(record: User) {
  await roleAuthCancel({ userId: record.userId, roleId });
  await tableApi.query();
}

/**
 * 批量取消授权
 */
function handleMultipleAuthCancel() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: User) => row.userId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认取消选中的${ids.length}条授权记录吗？`,
    onOk: async () => {
      await roleAuthCancelAll(roleId, ids);
      await tableApi.query();
      tableApi.grid.clearCheckboxRow();
    },
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
          <RoleAssignSearchForm
            @submit="handleSearchSubmit"
            @reset="handleSearchReset"
          />
        <div class="flex-1">
          <BasicTable table-title="已分配的用户列表">
          <template #toolbar-tools>
            <Space>
              <a-button
                :disabled="!vxeCheckboxChecked(tableApi)"
                danger
                type="primary"
                v-access:code="['system:role:remove']"
                @click="handleMultipleAuthCancel"
              >
                取消授权
              </a-button>
              <a-button
                type="primary"
                v-access:code="['system:role:add']"
                @click="handleAdd"
              >
                {{ $t('pages.common.add') }}
              </a-button>
            </Space>
          </template>
          <template #action="{ row }">
            <Popconfirm
              :title="`是否取消授权用户[${row.userName} - ${row.nickName}]?`"
              placement="left"
              @confirm="handleAuthCancel(row)"
            >
              <action-button
                danger
                v-access:code="['system:role:remove']"
                @click.stop=""
              >
                取消授权
              </action-button>
            </Popconfirm>
          </template>
        </BasicTable>
      </div>
    </div>
    </Spin>
    <RoleAssignDrawer @reload="tableApi.query()" />
  </Page>
</template>
