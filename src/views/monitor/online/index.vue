<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { OnlineUser } from '@/api/monitor/online/model';

import { ref } from 'vue';

import { useVbenVxeGrid } from '@/adapter/vxe-table';
import { forceLogout, onlineList } from '@/api/monitor/online';
import { Page } from '@/effects/common-ui';
import { Popconfirm, Spin } from 'antdv-next';
import { slice } from 'lodash-es';

import { columns } from './data';
import OnlineSearchForm from './online-search.vue';

const searchFormRef = ref<InstanceType<typeof OnlineSearchForm>>();

const onlineCount = ref(0);
const tableLoading = ref(false);
const gridOptions: VxeGridProps = {
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    showLoading: false,
    ajax: {
      // 后端其实是一个假分页 返回的是全部数据
      query: async ({ page }, formValues = {}) => {
        tableLoading.value = true;
        try {
          const resp = await onlineList({
            ...formValues,
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
  id: 'monitor-online-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({ gridOptions });

async function handleForceOffline(row: OnlineUser) {
  await forceLogout(row.tokenId);
  await tableApi.query();
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
        <OnlineSearchForm
          ref="searchFormRef"
          @reset="handleSearchReset"
          @submit="handleSearchSubmit"
        />
        <div class="flex-1">
          <BasicTable>
        <template #toolbar-actions>
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
      </BasicTable>
      </div>
    </div>
    </Spin>
  </Page>
</template>
