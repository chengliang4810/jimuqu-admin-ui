<script setup lang="ts">
import type { VxeGridProps } from '@/adapter/vxe-table';
import type { Dept } from '@/api/system/dept/model';
import { nextTick, ref } from 'vue';

import { useVbenVxeGrid } from '@/adapter/vxe-table';
import { deptList, deptRemove } from '@/api/system/dept';
import { Page, useVbenDrawer } from '@/effects/common-ui';
import { eachTree } from '@/utils';
import { Popconfirm, Space } from 'antdv-next';

import { columns } from './data';
import deptDrawer from './dept-drawer.vue';
import DeptSearchForm from './dept-search.vue';

const searchFormRef = ref<InstanceType<typeof DeptSearchForm>>();

const gridOptions: VxeGridProps = {
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async (_, formValues = {}) => {
        const resp = await deptList({
          ...formValues,
        });
        return { rows: resp };
      },
      // 默认请求接口后展开全部 不需要可以删除这段
      querySuccess: () => {
        // 默认展开 需要加上标记
        eachTree(tableApi.grid.getData(), (item) => (item.expand = true));
        nextTick(() => {
          setExpandOrCollapse(true);
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
    keyField: 'deptId',
  },
  treeConfig: {
    parentField: 'parentId',
    rowField: 'deptId',
    transform: true,
  },
  id: 'system-dept-index',
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
  gridEvents: {
    cellDblclick: (e) => {
      const { row = {} } = e;
      if (!row?.children) {
        return;
      }
      const isExpanded = row?.expand;
      tableApi.grid.setTreeExpand(row, !isExpanded);
      row.expand = !isExpanded;
    },
    // 需要监听使用箭头展开的情况 否则展开/折叠的数据不一致
    toggleTreeExpand: (e) => {
      const { row = {}, expanded } = e;
      row.expand = expanded;
    },
  },
});
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
  await tableApi.query();
}

/**
 * 全部展开/折叠
 * @param expand 是否展开
 */
function setExpandOrCollapse(expand: boolean) {
  eachTree(tableApi.grid.getData(), (item) => (item.expand = expand));
  tableApi.grid?.setAllTreeExpand(expand);
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
    <div class="flex h-full flex-col gap-4">
      <DeptSearchForm
        ref="searchFormRef"
        @submit="handleSearchSubmit"
        @reset="handleSearchReset"
      />
      <div class="flex-1">
        <BasicTable table-title="部门列表" table-title-help="双击展开/收起子菜单">
        <template #toolbar-tools>
          <Space>
            <a-button @click="setExpandOrCollapse(false)">
              {{ $t('pages.common.collapse') }}
            </a-button>
            <a-button @click="setExpandOrCollapse(true)">
              {{ $t('pages.common.expand') }}
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
      </BasicTable>
      </div>
    </div>
    <DeptDrawer @reload="tableApi.query()" />
  </Page>
</template>
