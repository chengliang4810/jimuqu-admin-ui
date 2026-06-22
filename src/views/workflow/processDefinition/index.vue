<!-- eslint-disable no-use-before-define -->
<script setup lang="ts">
import type { Recordable } from '@/types';
import type { RadioChangeEvent } from 'antdv-next';
import type { VxeGridInstance, VxeGridListeners } from 'vxe-table';

import { computed, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';

import {
  unPublishList,
  workflowDefinitionActive,
  workflowDefinitionCopy,
  workflowDefinitionDelete,
  workflowDefinitionExport,
  workflowDefinitionList,
  workflowDefinitionPublish,
} from '@/api/workflow/definition';
import { ApiSwitch } from '@/components/global';
import {
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Page, useVbenModal } from '@/components';
import { $t } from '@/locales';
import { downloadByData } from '@/utils/file/download';
import { Popconfirm, RadioGroup, Space, Spin } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import CategoryTree from './category-tree.vue';
import { columns } from './data';
import processDefinitionDeployModal from './process-definition-deploy-modal.vue';
import processDefinitionModal from './process-definition-modal.vue';
import ProcessDefinitionSearchForm from './process-definition-search.vue';

const searchFormRef = ref<InstanceType<typeof ProcessDefinitionSearchForm>>();

// 左边部门用
const selectedCode = ref<number[] | string[]>([]);

// 缓存最近一次搜索参数，分类树切换时重新查询用
const currentSearchParams = ref<Record<string, any>>({});

const tableLoading = ref(false);

// 左边的切换
const statusOptions = [
  { label: '已发布流程', value: 1 },
  { label: '未发布流程', value: 0 },
];
const currentStatus = ref(1);
const currentTableApi = computed(() => {
  if (currentStatus.value === 1) {
    return workflowDefinitionList;
  }
  return unPublishList;
});

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

          return await currentTableApi.value({
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
    height: 100,
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

async function handleStatusChange(e: RadioChangeEvent) {
  currentStatus.value = e.target.value as number;
  await reload();
}

async function handleDelete(row: Recordable<any>) {
  await workflowDefinitionDelete(row.id);
  // 取消该行选中状态，避免 reserve 记录残留
  tableRef.value?.setCheckboxRow(row, false);
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
      await workflowDefinitionDelete(ids);
      // 清除所有选中状态，避免 reserve 记录残留
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await query();
    },
  });
}

const router = useRouter();
/**
 * 流程设计/预览
 * @param row row
 * @param _disabled true为预览，false为设计
 */
function handleDesign(row: any, _disabled: boolean) {
  router.push({
    path: '/workflow/design/index',
    query: { definitionId: row.id },
  });
}

// ...跟系统其他定义的变量竟然是反的
const activeStatus = {
  Enable: 1,
  Disable: 0,
} as const;
/**
 * 激活/挂起流程
 * @param row row
 */
async function handleActive(row: any, checked: boolean) {
  const lastStatus = checked ? activeStatus.Enable : activeStatus.Disable;
  try {
    await workflowDefinitionActive(row.id, !!checked);
    await query();
  } catch (error) {
    row.activityStatus = lastStatus;
    console.error(error);
  }
}

/**
 * 发布流程
 * @param row row
 */
async function handlePublish(row: any) {
  await workflowDefinitionPublish(row.id);
  await query();
}

/**
 * 复制流程
 * @param row row
 */
async function handleCopy(row: any) {
  await workflowDefinitionCopy(row.id);
  // 跳转到未发布流程tab
  currentStatus.value = 0;
  await reload();
}

const [ProcessDefinitionModal, modalApi] = useVbenModal({
  connectedComponent: processDefinitionModal,
});

/**
 * 新增流程
 */
function handleAdd() {
  modalApi.setData({});
  modalApi.open();
}

/**
 * 编辑流程
 */
function handleEdit(row: any) {
  modalApi.setData({ id: row.id });
  modalApi.open();
}

/**
 * 导出xml
 * @param row row
 */
async function handleExportXml(row: any) {
  const hideLoading = window.message.loading(
    $t('pages.common.downloadLoading'),
    0,
  );
  try {
    const blob = await workflowDefinitionExport(row.id);
    downloadByData(blob, `${row.flowName}-${Date.now()}.json`);
  } catch (error) {
    console.error(error);
  } finally {
    hideLoading();
  }
}

const [ProcessDefinitionDeployModal, deployModalApi] = useVbenModal({
  connectedComponent: processDefinitionDeployModal,
});

/**
 * 部署流程xml
 */
function handleDeploy() {
  if (selectedCode.value.length === 0) {
    window.message.warning('请先选择流程分类');
    return;
  }
  const selectedCategory = selectedCode.value[0];
  if (selectedCategory === 0) {
    window.message.warning('不可选择根目录进行部署, 请选择子分类');
    return;
  }
  deployModalApi.setData({ category: selectedCategory });
  deployModalApi.open();
}

// 部署流程json
async function handleDeploySuccess() {
  // 跳转到未发布
  currentStatus.value = 0;
  await reload();
}

// 新增完成需要跳转到未发布
async function handleReload(type: 'add' | 'update') {
  if (type === 'add') {
    currentStatus.value = 0;
  }
  await reload();
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
          <ProcessDefinitionSearchForm
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
                  v-model:value="currentStatus"
                  :options="statusOptions"
                  button-style="solid"
                  option-type="button"
                  @change="handleStatusChange"
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
                  <a-button
                    v-access:code="['system:user:add']"
                    @click="handleDeploy"
                  >
                    部署
                  </a-button>
                  <a-button
                    type="primary"
                    v-access:code="['system:user:add']"
                    @click="handleAdd"
                  >
                    {{ $t('pages.common.add') }}
                  </a-button>
                </Space>
              </template>
              <template #activityStatus="{ row }">
                <ApiSwitch
                  :value="row.activityStatus === activeStatus.Enable"
                  checked-children="激活"
                  un-checked-children="挂起"
                  :api="(checked) => handleActive(row, checked)"
                  @reload="() => query()"
                />
              </template>
              <template #action="{ row }">
                <div class="flex flex-col gap-1">
                  <div>
                    <a-button size="small" type="link" @click="handleEdit(row)">
                      编辑信息
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
                      @click="handleDesign(row, !!row.isPublish)"
                    >
                      {{ row.isPublish ? '查看流程' : '设计流程' }}
                    </a-button>
                    <Popconfirm
                      :title="`确认发布流程[${row.flowName}]?`"
                      placement="left"
                      @confirm="handlePublish(row)"
                    >
                      <a-button v-if="!row.isPublish" size="small" type="link">
                        发布流程
                      </a-button>
                      <span v-else></span>
                      <!-- 必须要保证在Popconfirm存在元素 所以用v-else来接收 -->
                    </Popconfirm>
                  </div>
                  <div>
                    <Popconfirm
                      :title="`确认复制流程[${row.flowName}]?`"
                      placement="left"
                      @confirm="handleCopy(row)"
                    >
                      <a-button size="small" type="link"> 复制流程 </a-button>
                    </Popconfirm>
                    <a-button
                      size="small"
                      type="link"
                      @click="handleExportXml(row)"
                    >
                      导出流程
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
    <ProcessDefinitionModal @reload="handleReload" />
    <ProcessDefinitionDeployModal @reload="handleDeploySuccess" />
  </Page>
</template>
