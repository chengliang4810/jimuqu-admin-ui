<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { Post } from '@/api/system/post/model';

import { ref } from 'vue';

import { useVbenVxeGrid, vxeCheckboxChecked } from '@/adapter/vxe-table';
import {
  postDeptTreeSelect,
  postExport,
  postList,
  postRemove,
} from '@/api/system/post';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { useBlobExport } from '@/utils/file/export';
import DeptTree from '@/views/system/user/dept-tree.vue';
import { Popconfirm, Space, Spin } from 'antdv-next';

import { columns } from './data';
import postDrawer from './post-drawer.vue';
import PostSearchForm from './post-search.vue';

// 左边部门用
const selectDeptId = ref<string[]>([]);

const searchFormRef = ref<InstanceType<typeof PostSearchForm>>();
// 缓存最近一次搜索参数，部门树切换时重新查询用
const currentSearchParams = ref<Record<string, any>>({});

const tableLoading = ref(false);

const gridOptions: VxeGridProps = {
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
  id: 'system-post-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
});

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
  await tableApi.query();
}

function handleMultiDelete() {
  const rows = tableApi.grid.getCheckboxRecords();
  const ids = rows.map((row: Post) => row.postId);
  window.modal.confirm({
    title: '提示',
    okType: 'danger',
    content: `确认删除选中的${ids.length}条记录吗？`,
    onOk: async () => {
      await postRemove(ids);
      await tableApi.query();
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
  tableApi.reload(data);
}

function handleSearchReset() {
  currentSearchParams.value = {};
  selectDeptId.value = [];
  tableApi.reload();
}

function handleDeptSelect(keys: string[]) {
  selectDeptId.value = keys;
  tableApi.reload(currentSearchParams.value);
}
</script>

<template>
  <Page :auto-content-height="true" content-class="flex gap-[8px] w-full">
    <Spin
      :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
      :spinning="tableLoading"
      size="large"
      :delay="300"
    >
      <DeptTree
        :api="postDeptTreeSelect"
        v-model:select-dept-id="selectDeptId"
        class="w-[260px]"
        @reload="() => tableApi.reload()"
        @select="handleDeptSelect"
      />
      <div class="flex flex-1 flex-col gap-4 overflow-hidden">
        <PostSearchForm
          ref="searchFormRef"
          @submit="handleSearchSubmit"
          @reset="handleSearchReset"
        />
        <div class="flex-1">
          <BasicTable class="overflow-hidden" table-title="岗位列表">
      <template #toolbar-tools>
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
            :disabled="!vxeCheckboxChecked(tableApi)"
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
    </BasicTable>
      </div>
    </div>
    </Spin>
    <PostDrawer @reload="tableApi.query()" />
  </Page>
</template>
