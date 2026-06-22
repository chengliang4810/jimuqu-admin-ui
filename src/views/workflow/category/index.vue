<script setup lang="ts">
import type { Recordable } from '@/types';
import type { VxeGridInstance } from 'vxe-table';

import { nextTick, ref, useTemplateRef } from 'vue';

import { categoryList, categoryRemove } from '@/api/workflow/category';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenModal } from '@/components';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import categoryModal from './category-modal.vue';
import CategorySearchForm from './category-search.vue';
import { columns } from './data';

const searchFormRef = ref<InstanceType<typeof CategorySearchForm>>();

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Recordable<any>>({
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    showLoading: false,
    ajax: {
      query: async (_, formValues = {}) => {
        tableLoading.value = true;
        try {
          const resp = await categoryList({
            ...formValues,
          });
          return { rows: resp };
        } finally {
          tableLoading.value = false;
        }
      },
      // 默认请求接口后展开全部 不需要可以删除这段
      querySuccess: () => {
        nextTick(() => {
          expandAll();
        });
      },
    },
  },
  /**
   * 虚拟滚动  默认关闭
   */
  scrollY: {
    enabled: false,
    gt: 0,
  },
  rowConfig: {
    keyField: 'categoryId',
  },
  treeConfig: {
    parentField: 'parentId',
    rowField: 'categoryId',
    transform: true,
  },
  // 表格全局唯一表示 保存列配置需要用到
  id: 'workflow-category-index',
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
});

const tableRef = useTemplateRef<VxeGridInstance<Recordable<any>>>('tableRef');
const { query, reload } = useTableQuery(searchFormRef, tableRef);

const [CategoryModal, modalApi] = useVbenModal({
  connectedComponent: categoryModal,
});

function handleAdd(row?: Recordable<any>) {
  modalApi.setData({ parentId: row?.categoryId });
  modalApi.open();
}

async function handleEdit(row: Recordable<any>) {
  modalApi.setData({ id: row.categoryId });
  modalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  await categoryRemove(row.categoryId);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
  await query();
}

function expandAll() {
  tableRef.value?.setAllTreeExpand(true);
}

function collapseAll() {
  tableRef.value?.setAllTreeExpand(false);
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
        <CategorySearchForm
          ref="searchFormRef"
          @submit="handleSearchSubmit"
          @reset="handleSearchReset"
        />
        <div class="bg-card flex-1 overflow-hidden rounded-lg">
          <VxeGrid ref="tableRef" class="p-2 pt-0" v-bind="gridOptions">
            <template #toolbar-left>
              <div class="text-[16px] font-medium">流程分类列表</div>
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
                  v-access:code="['workflow:category:add']"
                  @click="handleAdd"
                >
                  {{ $t('pages.common.add') }}
                </a-button>
              </Space>
            </template>
            <template #action="{ row }">
              <Space>
                <action-button
                  v-access:code="['workflow:category:edit']"
                  @click.stop="handleEdit(row)"
                >
                  {{ $t('pages.common.edit') }}
                </action-button>
                <action-button
                  variant="link"
                  color="green"
                  v-access:code="['workflow:category:edit']"
                  @click.stop="handleAdd(row)"
                >
                  {{ $t('pages.common.add') }}
                </action-button>
                <Popconfirm
                  placement="left"
                  title="确认删除？"
                  @confirm="handleDelete(row)"
                >
                  <action-button
                    danger
                    v-access:code="['workflow:category:remove']"
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
    <CategoryModal @reload="() => query()" />
  </Page>
</template>
