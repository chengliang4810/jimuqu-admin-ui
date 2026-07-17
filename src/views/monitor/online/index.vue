<script setup lang="ts">
import type { OnlineUser } from '@/api/monitor/online/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import { forceLogout, onlineList } from '@/api/monitor/online';
import { Page } from '@/components';
import {
  resolveQueryFormValues,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Popconfirm, Spin } from 'antdv-next';
import { slice } from 'lodash-es';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import OnlineSearchForm from './online-search.vue';

const searchFormRef = ref<InstanceType<typeof OnlineSearchForm>>();

const onlineCount = ref(0);
const tableLoading = ref(false);
const gridOptions = withDefaultVxeGridOptions<OnlineUser>({
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    showLoading: false,
    ajax: {
      // 后端其实是一个假分页 返回的是全部数据
      query: async ({ page }, formValues) => {
        const values = await resolveQueryFormValues(searchFormRef, formValues);
        tableLoading.value = true;
        try {
          const resp = await onlineList({
            ...values,
          });
          // 设置在线数
          onlineCount.value = resp.total;

          const { currentPage, pageSize } = page;
          // 当前需要截取的index -> 当前page-1 * 每页条数
          const currentIndex = (currentPage - 1) * pageSize;
          // 当前需要截取的endIndex -> currentIndex + 每页条数
          const endIndex = currentIndex + pageSize;
          // 截取区间内的数据
          const sliceRows = slice(resp.rows, currentIndex, endIndex);
          resp.rows = sliceRows;

          return resp;
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  scrollY: {
    enabled: true,
    gt: 0,
  },
  rowConfig: {
    keyField: 'tokenId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
    },
  },
  id: 'monitor-online-index',
});

const gridEvents: VxeGridListeners = {};

const tableRef = useTemplateRef<VxeGridInstance<OnlineUser>>('tableRef');
const { query, reload } = useTableQuery(searchFormRef, tableRef);

async function handleForceOffline(row: OnlineUser) {
  await forceLogout(row.tokenId);
  await query();
}

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  reload();
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
        <OnlineSearchForm
          ref="searchFormRef"
          @reset="handleSearchReset"
          @submit="handleSearchSubmit"
        />
        <div class="bg-card flex-1 overflow-hidden rounded-lg">
          <VxeGrid
            ref="tableRef"
            class="p-2 pt-0"
            v-bind="gridOptions"
            v-on="gridEvents"
          >
            <template #toolbar-left>
              <div class="mr-1 pl-1 text-[1rem]">
                <div>
                  在线用户列表 (共
                  <span class="text-primary font-bold">{{ onlineCount }}</span>
                  人在线)
                </div>
              </div>
            </template>
            <template #action="{ row }">
              <Popconfirm
                :title="`确认强制下线[${row.userName}]?`"
                placement="left"
                @confirm="handleForceOffline(row)"
              >
                <action-button danger>强制下线</action-button>
              </Popconfirm>
            </template>
            <template #loading>
              <Spin :spinning="true" size="large" />
            </template>
          </VxeGrid>
        </div>
      </div>
    </Spin>
  </Page>
</template>
