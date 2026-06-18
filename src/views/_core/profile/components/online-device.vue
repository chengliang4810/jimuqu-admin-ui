<script setup lang="ts">
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { useTemplateRef } from 'vue';

import { forceLogout2, onlineDeviceList } from '@/api/monitor/online';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { columns } from '@/views/monitor/online/data';
import { Popconfirm, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

const onlineDeviceColumns = [
  {
    type: 'seq',
    title: '序号',
    width: 60,
  },
  // 个人中心不需要显示重复字段
  ...(columns?.filter(
    (item) => !['deptName', 'userName'].includes(item.field ?? ''),
  ) ?? []),
];

const gridOptions = withDefaultVxeGridOptions({
  columns: onlineDeviceColumns,
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  maxHeight: 600,
  proxyConfig: {
    ajax: {
      query: async () => {
        return await onlineDeviceList();
      },
    },
  },
  rowConfig: {
    keyField: 'tokenId',
    isCurrent: true,
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
});

const gridEvents: VxeGridListeners = {};

const tableRef = useTemplateRef<VxeGridInstance>('tableRef');

async function handleForceOffline(row: Record<string, any>) {
  await forceLogout2(row.tokenId);
  await query();
}

async function query(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('query', params);
}
</script>

<template>
  <div>
    <VxeGrid
      ref="tableRef"
      class="p-2 pt-0"
      v-bind="gridOptions"
      v-on="gridEvents"
    >
      <template #toolbar-left>
        <div class="text-[16px] font-medium">我的在线设备</div>
      </template>
      <template #action="{ row }">
        <Popconfirm
          :title="`确认强制下线[${row.userName}]?`"
          placement="left"
          @confirm="handleForceOffline(row)"
        >
          <a-button danger size="small" type="link">强制下线</a-button>
        </Popconfirm>
      </template>
      <template #loading>
        <Spin :spinning="true" size="large" />
      </template>
    </VxeGrid>
  </div>
</template>
