<script setup lang="ts">
import type { ScheduledJob } from '@/api/monitor/job/model';
import type { SwitchProps } from 'antdv-next';
import type { VxeGridInstance } from 'vxe-table';

import { ref, useTemplateRef } from 'vue';

import {
  jobList,
  jobRemove,
  jobRun,
  jobStart,
  jobStop,
} from '@/api/monitor/job';
import { Page, useVbenDrawer, useVbenModal } from '@/components';
import { useAccess } from '@/components/access';
import { ApiSwitch } from '@/components/global';
import {
  resolveQueryFormValues,
  useTableQuery,
  withDefaultVxeGridOptions,
} from '@/components/vxe-table';
import { Popconfirm, Space, Spin, Tag, Tooltip } from 'antdv-next';
import { VxeGrid } from 'vxe-table';

import { columns } from './data';
import JobLogDrawerComponent from './job-log-drawer.vue';
import JobModalComponent from './job-modal.vue';
import JobSearch from './job-search.vue';
import RetryConfigModalComponent from './retry-config-modal.vue';

const searchFormRef = ref<InstanceType<typeof JobSearch>>();
const tableLoading = ref(false);

const gridOptions = withDefaultVxeGridOptions<ScheduledJob>({
  columns,
  height: 'auto',
  pagerConfig: {},
  proxyConfig: {
    showLoading: false,
    ajax: {
      query: async ({ page }, formValues) => {
        const filters = await resolveQueryFormValues(searchFormRef, formValues);
        tableLoading.value = true;
        try {
          const keyword = String(filters.jobName ?? '')
            .trim()
            .toLowerCase();
          const filtered = (await jobList()).filter((job) => {
            const matchesName =
              !keyword ||
              job.jobName.toLowerCase().includes(keyword) ||
              job.description?.toLowerCase().includes(keyword);
            const matchesStatus =
              !filters.enabled || job.enabled === (filters.enabled === '0');
            return matchesName && matchesStatus;
          });
          const start = (page.currentPage - 1) * page.pageSize;
          return {
            rows: filtered.slice(start, start + page.pageSize),
            total: filtered.length,
          };
        } finally {
          tableLoading.value = false;
        }
      },
    },
  },
  rowConfig: {
    keyField: 'jobName',
  },
  toolbarConfig: {
    slots: {
      buttons: 'toolbar-left',
      tools: 'toolbar-right',
    },
  },
  id: 'monitor-job-index',
});

const tableRef = useTemplateRef<VxeGridInstance<ScheduledJob>>('tableRef');
const { query, reload } = useTableQuery(searchFormRef, tableRef);
const { hasAccessByCodes } = useAccess();
/** 动态任务新增与编辑弹窗。 */
const [JobModal, jobModalApi] = useVbenModal({
  connectedComponent: JobModalComponent,
});
const [RetryConfigModal, retryConfigModalApi] = useVbenModal({
  connectedComponent: RetryConfigModalComponent,
});
const [JobLogDrawer, jobLogDrawerApi] = useVbenDrawer({
  connectedComponent: JobLogDrawerComponent,
});

async function handleChangeStatus(
  checked: SwitchProps['checked'],
  row: ScheduledJob,
) {
  await (checked ? jobStart(row.jobName) : jobStop(row.jobName));
}

function handleSearchSubmit(data: Record<string, any>) {
  reload(data);
}

function handleSearchReset() {
  reload();
}

function handleRetryConfig(row: ScheduledJob) {
  retryConfigModalApi.setData(row);
  retryConfigModalApi.open();
}

/** 打开动态任务新增弹窗。 */
function handleAdd() {
  jobModalApi.setData({});
  jobModalApi.open();
}

/** 打开动态任务编辑弹窗。 */
function handleEdit(row: ScheduledJob) {
  jobModalApi.setData({ record: row });
  jobModalApi.open();
}

/** 删除指定动态任务并刷新列表。 */
async function handleDelete(row: ScheduledJob) {
  await jobRemove(row.jobName);
  await query();
}

function handleJobLog(row: ScheduledJob) {
  jobLogDrawerApi.setData(row);
  jobLogDrawerApi.open();
}
</script>

<template>
  <Page :auto-content-height="true">
    <Spin
      :delay="300"
      size="large"
      :spinning="tableLoading"
      :styles="{ root: { height: '100%' }, container: { height: '100%' } }"
    >
      <div class="flex h-full flex-col gap-4">
        <JobSearch
          ref="searchFormRef"
          @reset="handleSearchReset"
          @submit="handleSearchSubmit"
        />
        <div class="bg-card flex-1 overflow-hidden rounded-lg">
          <VxeGrid ref="tableRef" class="p-2 pt-0" v-bind="gridOptions">
            <template #toolbar-left>
              <div class="text-[16px] font-medium">定时任务列表</div>
            </template>
            <template #toolbar-right>
              <a-button
                v-access:code="['monitor:job:add']"
                type="primary"
                @click="handleAdd"
              >
                {{ $t('pages.common.add') }}
              </a-button>
            </template>
            <template #status="{ row }">
              <Space>
                <ApiSwitch
                  :api="(checked) => handleChangeStatus(checked, row)"
                  checked-text="启用"
                  :disabled="!hasAccessByCodes(['monitor:job:changeStatus'])"
                  un-checked-text="停用"
                  :value="row.enabled"
                  @reload="() => query()"
                />
                <Tooltip :title="row.runtimeError">
                  <Tag
                    :color="
                      row.runtimeStatus === 'RUNNING'
                        ? 'success'
                        : row.runtimeStatus === 'ERROR'
                          ? 'error'
                          : 'default'
                    "
                  >
                    {{
                      row.runtimeStatus === 'RUNNING'
                        ? '运行中'
                        : row.runtimeStatus === 'ERROR'
                          ? '异常'
                          : '已停止'
                    }}
                  </Tag>
                </Tooltip>
              </Space>
            </template>
            <template #action="{ row }">
              <Space>
                <Popconfirm
                  placement="left"
                  :title="`确认立即执行任务[${row.jobName}]？`"
                  @confirm="jobRun(row.jobName)"
                >
                  <action-button
                    v-access:code="['monitor:job:run']"
                    @click.stop=""
                  >
                    立即执行
                  </action-button>
                </Popconfirm>
                <action-button
                  :disabled="row.jobSource !== 'DYNAMIC'"
                  v-access:code="['monitor:job:edit']"
                  @click.stop="handleEdit(row)"
                >
                  {{ $t('pages.common.edit') }}
                </action-button>
                <action-button
                  v-access:code="['monitor:job:edit']"
                  @click.stop="handleRetryConfig(row)"
                >
                  重试设置
                </action-button>
                <action-button
                  v-access:code="['monitor:job:log:list']"
                  @click.stop="handleJobLog(row)"
                >
                  执行记录
                </action-button>
                <Popconfirm
                  :disabled="row.jobSource !== 'DYNAMIC'"
                  placement="left"
                  :title="`确认删除任务[${row.jobName}]？`"
                  @confirm="handleDelete(row)"
                >
                  <action-button
                    :disabled="row.jobSource !== 'DYNAMIC'"
                    danger
                    v-access:code="['monitor:job:remove']"
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
    <JobModal @reload="() => query()" />
    <RetryConfigModal @reload="() => query()" />
    <JobLogDrawer />
  </Page>
</template>
