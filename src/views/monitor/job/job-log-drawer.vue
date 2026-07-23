<script setup lang="ts">
import type {
  JobExecutionLog,
  JobLogQuery,
  ScheduledJob,
} from '@/api/monitor/job/model';
import type {
  VxeGridInstance,
  VxeGridListeners,
  VxeGridProps,
} from 'vxe-table';

import { computed, nextTick, ref, useTemplateRef } from 'vue';

import { jobLogClean, jobLogList, jobLogRemove } from '@/api/monitor/job';
import { useVbenDrawer } from '@/components';
import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { Select, Space, Spin, Tag } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

const jobName = ref('');
const tableLoading = ref(false);
const checkedRows = ref<JobExecutionLog[]>([]);
const filters = ref({
  status: undefined as string | undefined,
  triggerType: undefined as string | undefined,
});
const title = computed(() => `执行记录 - ${jobName.value}`);
const statusLabels: Record<string, string> = {
  FAILED: '失败',
  RETRY: '重试',
  SKIPPED: '跳过',
  SUCCESS: '成功',
};
const triggerTypeLabels: Record<string, string> = {
  MANUAL: '手动执行',
  SCHEDULED: '定时调度',
};

const columns: VxeGridProps<JobExecutionLog>['columns'] = [
  { align: 'center', resizable: false, type: 'checkbox', width: 45 },
  { field: 'logId', title: '编号', width: 80 },
  { field: 'status', slots: { default: 'status' }, title: '状态', width: 100 },
  {
    field: 'triggerType',
    formatter: ({ cellValue }) =>
      triggerTypeLabels[cellValue] ?? cellValue ?? '-',
    title: '触发类型',
    width: 110,
  },
  { field: 'attempt', title: '执行次数', width: 90 },
  { field: 'instanceId', minWidth: 160, title: '实例' },
  { field: 'startTime', title: '开始时间', width: 170 },
  {
    field: 'durationMs',
    formatter: ({ cellValue }) => `${cellValue} ms`,
    title: '耗时',
    width: 100,
  },
  {
    field: 'errorSummary',
    minWidth: 220,
    showOverflow: true,
    title: '异常摘要',
  },
];

const gridOptions = withDefaultVxeGridOptions<JobExecutionLog>({
  checkboxConfig: {
    highlight: true,
    reserve: true,
  },
  columns,
  height: 520,
  pagerConfig: {},
  proxyConfig: {
    autoLoad: false,
    showLoading: false,
    ajax: {
      query: async ({ page }) => {
        tableLoading.value = true;
        try {
          const params: JobLogQuery = {
            jobName: jobName.value,
            pageNum: page.currentPage,
            pageSize: page.pageSize,
            ...filters.value,
          };
          return await jobLogList(params);
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'logId',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'monitor-job-log',
});

const tableRef = useTemplateRef<VxeGridInstance<JobExecutionLog>>('tableRef');
const gridEvents: VxeGridListeners = {
  checkboxAll: syncCheckedRows,
  checkboxChange: syncCheckedRows,
};

const statusColors: Record<string, string> = {
  FAILED: 'error',
  RETRY: 'warning',
  SKIPPED: 'default',
  SUCCESS: 'success',
};

const [BasicDrawer, drawerApi] = useVbenDrawer({
  onClosed() {
    jobName.value = '';
    filters.value = { status: undefined, triggerType: undefined };
    checkedRows.value = [];
    tableRef.value?.clearCheckboxRow();
    tableRef.value?.clearCheckboxReserve();
  },
  async onOpenChange(open) {
    if (!open) {
      return;
    }
    const job = drawerApi.getData() as ScheduledJob;
    jobName.value = job.jobName;
    await nextTick();
    await reload();
  },
});

async function reload() {
  await tableRef.value?.commitProxy('reload');
  syncCheckedRows();
}

async function handleFilterChange() {
  tableRef.value?.clearCheckboxRow();
  tableRef.value?.clearCheckboxReserve();
  checkedRows.value = [];
  await reload();
}

function getCheckedRows() {
  const table = tableRef.value;
  if (!table) {
    return [];
  }
  return [
    ...table.getCheckboxRecords(),
    ...table.getCheckboxReserveRecords(),
  ] as JobExecutionLog[];
}

function syncCheckedRows() {
  checkedRows.value = getCheckedRows();
}

function handleRemove() {
  const ids = getCheckedRows().map((row) => row.logId);
  window.modal.confirm({
    content: `确认删除选中的${ids.length}条执行记录吗？`,
    okType: 'danger',
    onOk: async () => {
      await jobLogRemove(ids);
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await reload();
    },
    title: '提示',
  });
}

function handleClean() {
  window.modal.confirm({
    content: '确认清空所有任务的执行记录吗？此操作不可恢复。',
    okType: 'danger',
    onOk: async () => {
      await jobLogClean();
      tableRef.value?.clearCheckboxRow();
      tableRef.value?.clearCheckboxReserve();
      await reload();
    },
    title: '提示',
  });
}
</script>

<template>
  <BasicDrawer :footer="false" :size="1100" :title="title">
    <Spin :delay="300" :spinning="tableLoading">
      <VxeGrid ref="tableRef" v-bind="gridOptions" v-on="gridEvents">
        <template #toolbar-left>
          <Space>
            <Select
              v-model:value="filters.status"
              allow-clear
              class="w-32"
              placeholder="执行状态"
              :options="[
                { label: '成功', value: 'SUCCESS' },
                { label: '失败', value: 'FAILED' },
                { label: '重试', value: 'RETRY' },
                { label: '跳过', value: 'SKIPPED' },
              ]"
              @change="handleFilterChange"
            />
            <Select
              v-model:value="filters.triggerType"
              allow-clear
              class="w-32"
              placeholder="触发类型"
              :options="[
                { label: '定时调度', value: 'SCHEDULED' },
                { label: '手动执行', value: 'MANUAL' },
              ]"
              @change="handleFilterChange"
            />
          </Space>
        </template>
        <template #toolbar-right>
          <Space>
            <a-button
              v-access:code="['monitor:job:log:remove']"
              :disabled="checkedRows.length === 0"
              danger
              @click="handleRemove"
            >
              删除
            </a-button>
            <a-button
              v-access:code="['monitor:job:log:remove']"
              danger
              type="primary"
              @click="handleClean"
            >
              清空
            </a-button>
          </Space>
        </template>
        <template #status="{ row }">
          <Tag :color="statusColors[row.status]">
            {{ statusLabels[row.status] ?? row.status }}
          </Tag>
        </template>
        <template #loading>
          <Spin :spinning="true" size="large" />
        </template>
      </VxeGrid>
    </Spin>
  </BasicDrawer>
</template>
