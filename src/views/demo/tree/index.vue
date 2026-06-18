<script setup lang="ts">
import type { Recordable } from '@/types';
import type { VxeGridInstance } from 'vxe-table';

import { nextTick, useTemplateRef } from 'vue';

import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { Page, useVbenModal } from '@/effects/common-ui';
import { getPopupContainer, listToTree } from '@/utils';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { treeList, treeRemove } from './api';
import { columns } from './data';
import treeModal from './tree-modal.vue';

const gridOptions = withDefaultVxeGridOptions({
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async (_, formValues = {}) => {
        const resp = await treeList({
          ...formValues,
        });
        const treeData = listToTree(resp, {
          id: 'id',
          pid: 'parentId',
          children: 'children',
        });
        return { rows: treeData };
      },
      // 默认请求接口后展开全部 不需要可以删除这段
      querySuccess: () => {
        nextTick(() => {
          expandAll();
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  treeConfig: {
    parentField: 'parentId',
    rowField: 'id',
    transform: false,
  },
});

const tableRef = useTemplateRef<VxeGridInstance>('tableRef');
const [TreeModal, modalApi] = useVbenModal({
  connectedComponent: treeModal,
});

function handleAdd() {
  modalApi.setData({ update: false });
  modalApi.open();
}

async function handleEdit(row: Recordable<any>) {
  modalApi.setData({ id: row.id, update: true });
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  await treeRemove(row.id);
  await query();
}

function expandAll() {
  tableRef.value?.setAllTreeExpand(true);
}

function collapseAll() {
  tableRef.value?.setAllTreeExpand(false);
}

async function query(params: Record<string, any> = {}) {
  await tableRef.value?.commitProxy('query', params);
}
</script>

<template>
  <Page :auto-content-height="true">
    <VxeGrid ref="tableRef" class="p-2 pt-0" v-bind="gridOptions">
      <template #toolbar-left>
        <span class="pl-[7px] text-[16px]">测试树列表</span>
      </template>
      <template #toolbar-right>
        <Space>
          <a-button @click="collapseAll">
            {{ $t('pages.common.collapse') }}
          </a-button>
          <a-button @click="expandAll">
            {{ $t('pages.common.expand') }}
          </a-button>
          <a-button
            type="primary"
            v-access:code="['system:tree:add']"
            @click="handleAdd"
          >
            {{ $t('pages.common.add') }}
          </a-button>
        </Space>
      </template>
      <template #action="{ row }">
        <Space>
          <action-button
            v-access:code="['system:tree:edit']"
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
              v-access:code="['system:tree:remove']"
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
    <TreeModal @reload="() => query()" />
  </Page>
</template>
