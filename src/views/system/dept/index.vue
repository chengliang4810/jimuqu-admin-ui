<script setup lang="ts">
import type { Dept } from '@/api/system/dept/model';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { nextTick, ref, useTemplateRef } from 'vue';

import { deptList, deptRemove } from '@/api/system/dept';
import { Page, useVbenDrawer } from '@/components';
import {
  resolveQueryFormValues,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { eachTree } from '@/utils';
import { Popconfirm, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import deptDrawer from './dept-drawer.vue';
import DeptSearchForm from './dept-search.vue';

const searchFormRef = ref<InstanceType<typeof DeptSearchForm>>();

const tableLoading = ref(false);

const expandedAll = ref(false);

const gridOptions = withDefaultVxeGridOptions<Dept>({
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    showLoading: false,
    ajax: {
      query: async (_, formValues) => {
        const values = await resolveQueryFormValues(searchFormRef, formValues);
        tableLoading.value = true;
        try {
          const resp = await deptList({
            ...values,
          });
          return { rows: resp };
        } finally {
          tableLoading.value = false;
        }
      },
      // 默认请求接口后展开全部 不需要可以删除这段
      querySuccess: () => {
        // 默认展开 需要加上标记
        eachTree(
          tableRef.value?.getData() ?? [],
          (item) => (item.expand = true),
        );
        nextTick(() => {
          setExpandOrCollapse(true);
        });
      },
    },
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
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
    keyField: 'deptId',
  },
  treeConfig: {
    parentField: 'parentId',
    rowField: 'deptId',
    transform: true,
  },
  id: 'system-dept-index',
});

const gridEvents: VxeGridListeners = {
  cellDblclick: (e) => {
    const { row = {} } = e;
    if (!row?.children) {
      return;
    }
    const isExpanded = row?.expand;
    tableRef.value?.setTreeExpand(row, !isExpanded);
    row.expand = !isExpanded;
  },
  // 需要监听使用箭头展开的情况 否则展开/折叠的数据不一致
  toggleTreeExpand: (e) => {
    const { row = {}, expanded } = e;
    row.expand = expanded;
  },
};

const tableRef = useTemplateRef<VxeGridInstance<Dept>>('tableRef');
const { query, reload } = useTableQuery(searchFormRef, tableRef);

const [DeptDrawer, drawerApi] = useVbenDrawer({
  connectedComponent: deptDrawer,
});

function handleAdd() {
  drawerApi.setData({ update: false });
  drawerApi.open();
}

function handleSubAdd(row: Dept) {
  const { deptId } = row;
  drawerApi.setData({ id: deptId, update: false });
  drawerApi.open();
}

async function handleEdit(record: Dept) {
  drawerApi.setData({ id: record.deptId, update: true });
  drawerApi.open();
}

async function handleDelete(row: Dept) {
  await deptRemove(row.deptId);
  await query();
}

/**
 * 全部展开/折叠
 * @param expand 是否展开
 */
function setExpandOrCollapse(expand: boolean) {
  expandedAll.value = !expand;
  tableRef.value?.setAllTreeExpand(expand);
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
        <DeptSearchForm
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
              <div class="text-[16px] font-medium">部门列表</div>
              <div class="ml-2 text-[13px] text-[#999]">双击展开/收起</div>
            </template>
            <template #toolbar-right>
              <Space>
                <a-button @click="setExpandOrCollapse(expandedAll)">
                  全部{{
                    expandedAll
                      ? $t('pages.common.expand')
                      : $t('pages.common.collapse')
                  }}
                </a-button>
                <a-button
                  type="primary"
                  v-access:code="['system:dept:add']"
                  @click="handleAdd"
                >
                  {{ $t('pages.common.add') }}
                </a-button>
              </Space>
            </template>
            <template #action="{ row }">
              <Space>
                <action-button
                  v-access:code="['system:dept:edit']"
                  @click="handleEdit(row)"
                >
                  {{ $t('pages.common.edit') }}
                </action-button>
                <action-button
                  variant="link"
                  color="green"
                  v-access:code="['system:dept:add']"
                  @click="handleSubAdd(row)"
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
                    v-access:code="['system:dept:remove']"
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
    <DeptDrawer @reload="() => query()" />
  </Page>
</template>
