<script setup lang="ts">
import type { Notice } from '@/api/system/notice/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import { noticeList, noticeRemove } from '@/api/system/notice';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenModal } from '@/effects/common-ui';
import { notificationMitt } from '@/utils/mitt/notification';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import noticeModal from './notice-modal.vue';
import NoticeSearchForm from './notice-search.vue';

const searchFormRef = ref<InstanceType<typeof NoticeSearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Notice>({
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
          return await noticeList({
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
    keyField: 'noticeId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-notice-index',
});

const tableRef = useTemplateRef<VxeGridInstance<Notice>>('tableRef');
const { query, reload } = useTableQuery(searchFormRef, tableRef, syncCheckedRows);
const checkedRows = ref<Notice[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const [NoticeModal, modalApi] = useVbenModal({
  connectedComponent: noticeModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleEdit(record: Notice) {
  modalApi.setData({ id: record.noticeId });
  modalApi.open();
}

async function handleDelete(row: Notice) {
  await noticeRemove([row.noticeId]);
  await query();
}

function handlePreview(record: Notice) {
  notificationMitt.emit('openModal', record);
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: Notice) => row.noticeId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await noticeRemove(ids);
      await query();
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
  ] as Notice[];
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
        <NoticeSearchForm
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
              <div class="text-[16px] font-medium">通知公告列表</div>
            </template>
        <template #toolbar-right>
          <Space>
            <a-button
              :disabled="checkedRows.length === 0"
              danger
              type="primary"
              v-access:code="['system:notice:remove']"
              @click="handleMultiDelete"
            >
              {{ $t('pages.common.delete') }}
            </a-button>
            <a-button
              type="primary"
              v-access:code="['system:notice:add']"
              @click="handleAdd"
            >
              {{ $t('pages.common.add') }}
            </a-button>
          </Space>
        </template>
        <template #action="{ row }">
          <Space>
            <action-button @click="handlePreview(row)">
              {{ $t('pages.common.preview') }}
            </action-button>
            <action-button
              v-access:code="['system:notice:edit']"
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
                v-access:code="['system:notice:remove']"
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
    <NoticeModal @reload="() => query()" />
  </Page>
</template>
