<script setup lang="ts">
import type { User } from '@/api/system/user/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import {
  roleAllocatedList,
  roleAuthCancel,
  roleAuthCancelAll,
} from '@/api/system/role';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenDrawer } from '@/components';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import roleAssignDrawer from './role-assign-drawer.vue';
import RoleAssignSearchForm from './role-assign-search.vue';

const searchFormRef = ref<InstanceType<typeof RoleAssignSearchForm>>();

const route = useRoute();
const roleId = route.params.roleId as string;

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<User>({
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
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-role-assign-index',
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<User>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<User[]>([]);

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
  await query();
}

/**
 * 批量取消授权
 */
function handleMultipleAuthCancel() {
  const rows = getCheckedRows();
  const ids = rows.map((row: User) => row.userId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认取消选中的${ids.length}条授权记录吗？`,
    onOk: async () => {
      await roleAuthCancelAll(roleId, ids);
      await query();
      tableRef.value?.clearCheckboxRow();
    },
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
  ] as User[];
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
        <RoleAssignSearchForm
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
              <div class="text-[16px] font-medium">已分配的用户列表</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button
                  :disabled="checkedRows.length === 0"
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
            <template #loading>
              <Spin :spinning="true" size="large" />
            </template>
          </VxeGrid>
        </div>
      </div>
    </Spin>
    <RoleAssignDrawer @reload="() => query()" />
  </Page>
</template>
