<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenVxeGrid } from '@/adapter/vxe-table';
import { roleSelectAll, roleUnallocatedList } from '@/api/system/role';
import { useVbenDrawer } from '@/effects/common-ui';

import { columns } from './data';
import RoleAssignSearchForm from './role-assign-search.vue';

const emit = defineEmits<{ reload: [] }>();

const [BasicDrawer, drawerApi] = useVbenDrawer({
  onConfirm: handleSubmit,
  onCancel: handleReset,
  destroyOnClose: true,
});

const route = useRoute();
const roleId = route.params.roleId as string;

const searchFormRef = ref<InstanceType<typeof RoleAssignSearchForm>>();
const searchParams = ref<Record<string, any>>({});

const gridOptions: VxeGridProps = {
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
        return await roleUnallocatedList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          roleId,
          ...searchParams.value,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'userId',
  },
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

async function handleSubmit() {
  const records = tableApi.grid.getCheckboxRecords();
  const userIds = records.map((item) => item.userId);
  if (userIds.length > 0) {
    await roleSelectAll(roleId, userIds);
  }
  handleReset();
  emit('reload');
}

function handleSearch(values: Record<string, any>) {
  searchParams.value = values;
  tableApi.grid.reload();
}

function handleSearchReset() {
  searchFormRef.value?.resetFields();
  searchParams.value = {};
  tableApi.grid.reload();
}

function handleReset() {
  drawerApi.close();
}
</script>

<template>
  <BasicDrawer :size="800" title="选择用户">
    <div class="flex h-full flex-col gap-4">
      <RoleAssignSearchForm
        ref="searchFormRef"
        @submit="handleSearch"
        @reset="handleSearchReset"
      />
      <div class="flex-1">
        <BasicTable />
      </div>
    </div>
  </BasicDrawer>
</template>
