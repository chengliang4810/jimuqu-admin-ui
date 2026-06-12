<script lang="tsx" setup>
import type { FormType } from './job-form-modal.vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { NTag } from 'naive-ui';

import { requestClient } from '#/api/request';

import jobFormModal from './job-form-modal.vue';

const message = useMessage();
const dialog = useDialog();

interface JobVo {
  id: string;
  jobName: string;
  jobGroup: string;
  handlerKey: string;
  handlerParam: string;
  cronExpression: string;
  status: number;
  allowConcurrent: boolean;
  lastRunTime: string;
  nextRunTime: string;
  remark: string;
  createTime: string;
  updateTime: string;
}

const jobStatusOptions = [
  { label: '启用', value: 0 },
  { label: '停用', value: 1 },
];

function renderStatus(status: number) {
  return status === 0 ? (
    <NTag type="success">启用</NTag>
  ) : (
    <NTag type="warning">停用</NTag>
  );
}

function renderBoolean(value: boolean) {
  return value ? <NTag type="info">允许</NTag> : <NTag>禁止</NTag>;
}

function formatOptionalDateTime({ cellValue }: { cellValue?: null | string }) {
  return cellValue ? formatDateTime(cellValue) : '';
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
      },
      fieldName: 'jobName',
      label: '任务名称',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务分组',
      },
      fieldName: 'jobGroup',
      label: '任务分组',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入处理器标识',
      },
      fieldName: 'handlerKey',
      label: '处理器',
    },
    {
      component: 'Select',
      componentProps: {
        options: jobStatusOptions,
      },
      fieldName: 'status',
      label: '任务状态',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  submitOnChange: false,
  submitOnEnter: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

const gridOptions: VxeGridProps<JobVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'id', title: '任务ID', width: 100 },
    { field: 'jobName', title: '任务名称', minWidth: 160 },
    { field: 'jobGroup', title: '任务分组', width: 120 },
    { field: 'handlerKey', title: '处理器标识', minWidth: 220 },
    { field: 'cronExpression', title: 'Cron表达式', minWidth: 160 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }) => renderStatus(row.status),
      },
    },
    {
      field: 'allowConcurrent',
      title: '并发执行',
      width: 100,
      slots: {
        default: ({ row }) => renderBoolean(row.allowConcurrent),
      },
    },
    {
      field: 'lastRunTime',
      formatter: formatOptionalDateTime,
      title: '上次运行时间',
      minWidth: 170,
    },
    {
      field: 'nextRunTime',
      formatter: formatOptionalDateTime,
      title: '下次运行时间',
      minWidth: 170,
    },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 300,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return await requestClient.get<JobVo[]>('/system/job/list', {
          params: {
            currentPage,
            pageSize,
            ...formValues,
          },
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    // @ts-ignore 正式环境时有完整的类型声明
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const [JobFormModal, jobFormModalApi] = useVbenModal({
  connectedComponent: jobFormModal,
});

function openModal(formType: FormType, row?: JobVo) {
  jobFormModalApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

function refreshTable() {
  gridApi.reload();
}

async function handleDelete(ids: string | string[]) {
  const data = await requestClient.post(`/system/job/delete/${ids}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的定时任务');
    return;
  }

  dialog.warning({
    content: `确认删除 ${records.length} 个定时任务吗？`,
    draggable: true,
    negativeText: '取消',
    onPositiveClick: async () => {
      await handleDelete(records.map((item) => item.id));
    },
    positiveText: '确定',
    title: '删除定时任务',
  });
}

async function updateJobState(row: JobVo, action: 'start' | 'stop') {
  await requestClient.post(`/system/job/${action}/${row.id}`);
  message.success(action === 'start' ? '任务已启动' : '任务已停止');
  refreshTable();
}

async function runJob(row: JobVo) {
  await requestClient.post(`/system/job/run/${row.id}`);
  message.success('任务已提交执行');
  refreshTable();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <n-button class="mr-2" type="error" @click="handleDeleteCheck">
            删除
          </n-button>
          <n-button class="mr-2" type="primary" @click="openModal('add')">
            新增
          </n-button>
        </n-flex>
      </template>
      <template #action="{ row }">
        <n-flex class="mx-2" justify="space-around" size="small">
          <n-button
            ghost
            size="small"
            type="info"
            @click="openModal('update', row)"
          >
            编辑
          </n-button>
          <n-button
            v-if="row.status !== 0"
            ghost
            size="small"
            type="success"
            @click="updateJobState(row, 'start')"
          >
            启动
          </n-button>
          <n-button
            v-else
            ghost
            size="small"
            type="warning"
            @click="updateJobState(row, 'stop')"
          >
            停止
          </n-button>
          <n-button ghost size="small" type="primary" @click="runJob(row)">
            执行
          </n-button>
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button ghost size="small" type="error">删除</n-button>
            </template>
            确认删除该定时任务吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <JobFormModal @reload="refreshTable" />
  </Page>
</template>
