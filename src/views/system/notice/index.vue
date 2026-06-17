<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { Notice } from '@/api/system/notice/model';
import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import { noticeList, noticeRemove } from '@/api/system/notice';
import { Page, useVbenModal } from '@/effects/common-ui';
import { notificationMitt } from '@/utils/mitt/notification';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { ref } from 'vue';

import { columns } from './data';
import noticeModal from './notice-modal.vue';
import NoticeSearchForm from './notice-search.vue';

const searchFormRef = ref<InstanceType<typeof NoticeSearchForm>>();

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
  id: 'system-notice-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

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
  await tableApi.query();
}

function handlePreview(record: Notice) {
  notificationMitt.emit('openModal', record);
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: Notice) => row.noticeId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await noticeRemove(ids);
      await tableApi.query();
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
        <NoticeSearchForm
          ref="searchFormRef"
          @reset="handleSearchReset"
          @submit="handleSearchSubmit"
        />
        <div class="flex-1">
          <BasicTable table-title="通知公告列表">
        <template #toolbar-tools>
          <Space>
            <a-button
              :disabled="!vxeCheckboxChecked(tableApi)"
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
      </BasicTable>
      </div>
    </div>
    </Spin>
    <NoticeModal @reload="tableApi.query()" />
  </Page>
</template>
