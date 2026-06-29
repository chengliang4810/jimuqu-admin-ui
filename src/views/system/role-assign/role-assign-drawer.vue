<script setup lang="ts">
import type { User } from '@/api/system/user/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import { roleSelectAll, roleUnallocatedList } from '@/api/system/role';
import { useVbenDrawer } from '@/components';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import RoleAssignSearchForm from './role-assign-search.vue';

const emit = defineEmits<{ reload: [] }>();
const drawerRoleId = ref('');
const [BasicDrawer, drawerApi] = useVbenDrawer({
  onConfirm: handleSubmit,
  onCancel: handleReset,
  destroyOnClose: true,
});

const searchFormRef = ref<InstanceType<typeof RoleAssignSearchForm>>();
const searchParams = ref<Record<string, any>>({});
const tableLoading = ref(false);
const gridOptions = withDefaultVxeGridOptions<User>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    trigger: 'row',
  },
  columns: columns?.filter((item) => item.field !== 'action'),
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        tableLoading.value = true;
        try {
          const { roleId } = drawerApi.getData() as { roleId: string };
          drawerRoleId.value = roleId;
          return roleUnallocatedList({
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            roleId,
            ...searchParams.value,
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
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<User>>('tableRef');
const checkedRows = ref<User[]>([]);

async function handleSubmit() {
  const records = getCheckedRows();
  const userIds = records.map((item) => item.userId);
  if (userIds.length > 0) {
    await roleSelectAll(drawerRoleId.value, userIds);
  }
  handleReset();
  emit('reload');
}

function handleSearch(values: Record<string, any>) {
  searchParams.value = values;
  reload();
}

function handleSearchReset() {
  searchFormRef.value?.resetFields();
  searchParams.value = {};
  reload();
}

function handleReset() {
  drawerApi.close();
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

async function reload(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('reload', params);
  syncCheckedRows();
}
</script>

<template>
  <BasicDrawer :size="600" title="选择用户">
    <div class="flex h-full flex-col gap-4">
      <RoleAssignSearchForm
        ref="searchFormRef"
        @submit="handleSearch"
        @reset="handleSearchReset"
      />
      <div class="bg-card flex-1 overflow-hidden rounded-lg">
        <VxeGrid
          ref="tableRef"
          class="p-2 pt-0"
          v-bind="gridOptions"
          v-on="gridEvents"
        >
          <template #loading>
            <Spin :spinning="true" size="large" />
          </template>
        </VxeGrid>
      </div>
    </div>
  </BasicDrawer>
</template>
