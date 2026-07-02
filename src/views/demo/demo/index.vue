<script setup lang="ts">
import type { Recordable } from '@/types';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import { Page, useVbenModal } from '@/components';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { getPopupContainer } from '@/utils';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { demoList, demoRemove } from './api';
import { columns } from './data';
import demoModal from './demo-modal.vue';

interface DemoRow {
  id: number | string;
  [key: string]: any;
}

const gridOptions = withDefaultVxeGridOptions<DemoRow>({
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
    ajax: {
      query: async ({ page }, formValues) => {
        // 刷新按钮会把 PointerEvent 透传进来，非普通对象时忽略
        const values =
          formValues && !(formValues instanceof Event) ? formValues : {};
        return await demoList({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...values,
        });
      },
    },
  },
  rowConfig: {
    isHover: true,
    keyField: 'id',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
});

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const tableRef = useTemplateRef<VxeGridInstance<DemoRow>>('tableRef');
const checkedRows = ref<DemoRow[]>([]);

const [DemoModal, modalApi] = useVbenModal({
  connectedComponent: demoModal,
});

function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

async function handleEdit(record: Recordable<any>) {
  modalApi.setData({ id: record.id });
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  await demoRemove(row.id);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: any) => row.id);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await demoRemove(ids);
      await query();
    },
  });
}

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as DemoRow[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}

async function query(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('query', params);
  syncCheckedRows();
}

async function reload(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('reload', params);
  syncCheckedRows();
}
</script>

<template>
  <Page :auto-content-height="true">
    <VxeGrid
      ref="tableRef"
      class="p-2 pt-0"
      v-bind="gridOptions"
      v-on="gridEvents"
    >
      <template #toolbar-left>
        <span class="pl-[7px] text-[16px]">测试单列表</span>
      </template>
      <template #toolbar-right>
        <Space>
          <a-button
            :disabled="checkedRows.length === 0"
            danger
            type="primary"
            v-access:code="['system:demo:remove']"
            @click="handleMultiDelete"
          >
            {{ $t('pages.common.delete') }}
          </a-button>
          <a-button
            type="primary"
            v-access:code="['system:demo:add']"
            @click="handleAdd"
          >
            {{ $t('pages.common.add') }}
          </a-button>
        </Space>
      </template>
      <template #action="{ row }">
        <Space>
          <action-button
            v-access:code="['system:demo:edit']"
            @click.stop="handleEdit(row)"
          >
            {{ $t('pages.common.edit') }}
          </action-button>
          <Popconfirm
            :get-popup-container="getPopupContainer"
            placement="left"
            title="确认删除？"
            @confirm="handleDelete(row)"
          >
            <action-button
              danger
              v-access:code="['system:demo:remove']"
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
    <DemoModal @reload="() => query()" />
  </Page>
</template>
