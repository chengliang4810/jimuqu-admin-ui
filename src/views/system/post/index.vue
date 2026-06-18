<script setup lang="ts">
import type { Post } from '@/api/system/post/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  postDeptTreeSelect,
  postExport,
  postList,
  postRemove,
} from '@/api/system/post';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import DeptTree from '@/views/system/user/dept-tree.vue';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import postDrawer from './post-drawer.vue';
import PostSearchForm from './post-search.vue';

// 左边部门用
const selectDeptId = ref<string[]>([]);

const searchFormRef = ref<InstanceType<typeof PostSearchForm>>();
// 缓存最近一次搜索参数，部门树切换时重新查询用
const currentSearchParams = ref<Record<string, any>>({});

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Post>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    trigger: 'cell',
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
          // 部门树选择处理
          if (selectDeptId.value.length === 1) {
            formValues.belongDeptId = selectDeptId.value[0];
          } else {
            Reflect.deleteProperty(formValues, 'belongDeptId');
          }

          return await postList({
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
    keyField: 'postId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'system-post-index',
});

const tableRef = useTemplateRef<VxeGridInstance<Post>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<Post[]>([]);

const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const [PostDrawer, drawerApi] = useVbenDrawer({
  connectedComponent: postDrawer,
});

function handleAdd() {
  drawerApi.setData({});
  drawerApi.open();
}

async function handleEdit(record: Post) {
  drawerApi.setData({ id: record.postId });
  drawerApi.open();
}

async function handleDelete(row: Post) {
  await postRemove([row.postId]);
  await query();
}

function handleMultiDelete() {
  const rows = getCheckedRows();
  const ids = rows.map((row: Post) => row.postId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await postRemove(ids);
      await query();
    },
  });
}

const { exportBlob, exportLoading, buildExportFileName } =
  useBlobExport(postExport);
async function handleExport() {
  // 构建表单请求参数
  const formValues = (await searchFormRef.value?.getValues()) ?? {};
  // 文件名
  const fileName = buildExportFileName('岗位数据');
  exportBlob({ data: formValues, fileName });
}

function handleSearchSubmit(data: Record<string, any>) {
  currentSearchParams.value = data;
  reload(data);
}

function handleSearchReset() {
  currentSearchParams.value = {};
  selectDeptId.value = [];
  reload();
}

function handleDeptSelect(keys: string[]) {
  selectDeptId.value = keys;
  reload(currentSearchParams.value);
}

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as Post[];
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
      <div class="flex h-full gap-[8px]">
        <DeptTree
          :api="postDeptTreeSelect"
          v-model:select-dept-id="selectDeptId"
          class="w-[260px]"
          @reload="() => reload()"
          @select="handleDeptSelect"
        />
        <div class="flex flex-1 flex-col gap-4 overflow-hidden">
          <PostSearchForm
            ref="searchFormRef"
            @submit="handleSearchSubmit"
            @reset="handleSearchReset"
          />
          <div class="bg-card flex-1 overflow-hidden rounded-lg">
            <VxeGrid
              ref="tableRef"
              class="p-2 pt-0"
              v-bind="gridOptions"
              v-on="gridEvents"
            >
              <template #toolbar-left>
                <div class="text-[16px] font-medium">岗位列表</div>
              </template>
              <template #toolbar-right>
                <Space>
                  <a-button
                    v-access:code="['system:post:export']"
                    :loading="exportLoading"
                    :disabled="exportLoading"
                    @click="handleExport"
                  >
                    {{ $t('pages.common.export') }}
                  </a-button>
                  <a-button
                    :disabled="checkedRows.length === 0"
                    danger
                    type="primary"
                    v-access:code="['system:post:remove']"
                    @click="handleMultiDelete"
                  >
                    {{ $t('pages.common.delete') }}
                  </a-button>
                  <a-button
                    type="primary"
                    v-access:code="['system:post:add']"
                    @click="handleAdd"
                  >
                    {{ $t('pages.common.add') }}
                  </a-button>
                </Space>
              </template>
              <template #action="{ row }">
                <Space>
                  <action-button
                    v-access:code="['system:post:edit']"
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
                      v-access:code="['system:post:remove']"
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
      </div>
    </Spin>
    <PostDrawer @reload="() => query()" />
  </Page>
</template>
