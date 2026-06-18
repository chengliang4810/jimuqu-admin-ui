<script setup lang="ts">
import type { Recordable } from '@/types';
import type { RadioChangeEvent } from 'antdv-next';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  deleteByInstanceIds,
  pageByFinish,
  pageByRunning,
} from '@/api/workflow/instance';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenModal } from '@/effects/common-ui';
import { $t } from '@/locales';
import CategoryTree from '@/views/workflow/processDefinition/category-tree.vue';
import { Popconfirm, RadioGroup, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { flowInfoModal } from '../components';
import { columns } from './data';
import instanceInvalidModal from './instance-invalid-modal.vue';
import instanceVariableModal from './instance-variable-modal.vue';
import ProcessInstanceSearchForm from './process-instance-search.vue';

const searchFormRef = ref<InstanceType<typeof ProcessInstanceSearchForm>>();

// 左边分类用
const selectedCode = ref<number[] | string[]>([]);

// 缓存最近一次搜索参数，分类树切换时重新查询用
const currentSearchParams = ref<Record<string, any>>({});

const typeOptions = [
  { label: '运行中', value: 'process_running' },
  { label: '已完成', value: 'process_completed' },
];
let currentTypeApi = pageByRunning;
const currentType = ref('process_running');
async function handleTypeChange(e: RadioChangeEvent) {
  const { value } = e.target;
  switch (value) {
    case 'process_completed': {
      currentTypeApi = pageByFinish;
      break;
    }
    case 'process_running': {
      currentTypeApi = pageByRunning;
      break;
    }
  }

  await reload();
}

const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<Recordable<any>>({
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    trigger: 'default',
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
          if (selectedCode.value.length === 1) {
            formValues.category = selectedCode.value[0];
          } else {
            Reflect.deleteProperty(formValues, 'category');
          }

          return await currentTypeApi({
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
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 66,
  },
  rowConfig: {
    keyField: 'id',
  },
  id: 'workflow-definition-index',
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

const tableRef = useTemplateRef<VxeGridInstance<Recordable<any>>>('tableRef');
const { query, reload } = useTableQuery(
  searchFormRef,
  tableRef,
  syncCheckedRows,
);
const checkedRows = ref<Recordable<any>[]>([]);

const [InstanceInvalidModal, instanceInvalidModalApi] = useVbenModal({
  connectedComponent: instanceInvalidModal,
});
async function handleInvalid(row: Recordable<any>) {
  instanceInvalidModalApi.setData({ id: row.id });
  instanceInvalidModalApi.open();
}

async function handleDelete(row: Recordable<any>) {
  await deleteByInstanceIds(row.id);
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
      await deleteByInstanceIds(ids);
      await query();
    },
  });
}
const [InstanceVariableModal, instanceVariableModalApi] = useVbenModal({
  connectedComponent: instanceVariableModal,
});
function handleVariable(row: Recordable<any>) {
  instanceVariableModalApi.setData({ instanceId: row.id });
  instanceVariableModalApi.open();
}

const [FlowInfoModal, flowInfoModalApi] = useVbenModal({
  connectedComponent: flowInfoModal,
});
function handleInfo(row: any) {
  console.log(row);
  flowInfoModalApi.setData({ businessId: row.businessId });
  flowInfoModalApi.open();
}

function handleSearchSubmit(data: Record<string, any>) {
  currentSearchParams.value = data;
  reload(data);
}

function handleSearchReset() {
  currentSearchParams.value = {};
  selectedCode.value = [];
  reload();
}

function handleCategorySelect(keys: string[]) {
  selectedCode.value = keys;
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
  ] as Recordable<any>[];
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
        <CategoryTree
          v-model:select-code="selectedCode"
          class="w-[260px]"
          @reload="() => reload()"
          @select="handleCategorySelect"
        />
        <div class="flex flex-1 flex-col gap-4 overflow-hidden">
          <ProcessInstanceSearchForm
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
                <RadioGroup
                  v-model:value="currentType"
                  :options="typeOptions"
                  button-style="solid"
                  option-type="button"
                  @change="handleTypeChange"
                />
              </template>
              <template #toolbar-right>
                <Space>
                  <a-button
                    :disabled="checkedRows.length === 0"
                    danger
                    type="primary"
                    v-access:code="['system:user:remove']"
                    @click="handleMultiDelete"
                  >
                    {{ $t('pages.common.delete') }}
                  </a-button>
                </Space>
              </template>
              <template #action="{ row }">
                <div class="flex flex-col">
                  <div v-if="currentType === 'process_running'">
                    <a-button
                      danger
                      size="small"
                      type="link"
                      @click.stop="handleInvalid(row)"
                    >
                      作废流程
                    </a-button>
                    <Popconfirm
                      placement="left"
                      title="确认删除？"
                      @confirm="handleDelete(row)"
                    >
                      <a-button danger size="small" type="link" @click.stop="">
                        删除流程
                      </a-button>
                    </Popconfirm>
                  </div>
                  <div>
                    <a-button
                      size="small"
                      type="link"
                      @click.stop="handleInfo(row)"
                    >
                      流程预览
                    </a-button>
                    <a-button
                      size="small"
                      type="link"
                      @click.stop="handleVariable(row)"
                    >
                      变量查看
                    </a-button>
                  </div>
                </div>
              </template>
              <template #loading>
                <Spin :spinning="true" size="large" />
              </template>
            </VxeGrid>
          </div>
        </div>
      </div>
    </Spin>
    <InstanceInvalidModal @reload="() => reload()" />
    <InstanceVariableModal />
    <FlowInfoModal />
  </Page>
</template>
