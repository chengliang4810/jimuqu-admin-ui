<script lang="tsx" setup>
import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { NTag } from 'naive-ui';

import { requestClient } from '#/api/request';

const message = useMessage();
const dialog = useDialog();

interface JobLogVo {
  id: string;
  jobId: string;
  jobName: string;
  jobGroup: string;
  handlerKey: string;
  handlerParam: string;
  status: number;
  startTime: string;
  endTime: string;
  durationMs: number;
  errorMessage: string;
  createTime: string;
}

const statusOptions = [
  { label: '成功', value: 0 },
  { label: '失败', value: 1 },
  { label: '跳过', value: 2 },
];

function renderStatus(status: number) {
  if (status === 0) {
    return <NTag type="success">成功</NTag>;
  }
  if (status === 2) {
    return <NTag type="warning">跳过</NTag>;
  }
  return <NTag type="error">失败</NTag>;
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
        placeholder: '请输入处理器标识',
      },
      fieldName: 'handlerKey',
      label: '处理器',
    },
    {
      component: 'Select',
      componentProps: {
        options: statusOptions,
      },
      fieldName: 'status',
      label: '运行状态',
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

const gridOptions: VxeGridProps<JobLogVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'id', title: '日志ID', width: 100 },
    { field: 'jobName', title: '任务名称', minWidth: 160 },
    { field: 'jobGroup', title: '任务分组', width: 120 },
    { field: 'handlerKey', title: '处理器标识', minWidth: 220 },
    {
      field: 'status',
      title: '运行状态',
      width: 100,
      slots: {
        default: ({ row }) => renderStatus(row.status),
      },
    },
    {
      field: 'startTime',
      formatter: formatOptionalDateTime,
      title: '开始时间',
      minWidth: 170,
    },
    {
      field: 'endTime',
      formatter: formatOptionalDateTime,
      title: '结束时间',
      minWidth: 170,
    },
    { field: 'durationMs', title: '耗时(ms)', width: 110 },
    { field: 'errorMessage', title: '错误信息', minWidth: 220 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 120,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return await requestClient.get<JobLogVo[]>('/system/job/log/list', {
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

function refreshTable() {
  gridApi.reload();
}

async function handleDelete(ids: string | string[]) {
  const data = await requestClient.post(`/system/job/log/delete/${ids}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的运行日志');
    return;
  }

  dialog.warning({
    content: `确认删除 ${records.length} 条运行日志吗？`,
    draggable: true,
    negativeText: '取消',
    onPositiveClick: async () => {
      await handleDelete(records.map((item) => item.id));
    },
    positiveText: '确定',
    title: '删除运行日志',
  });
}

function handleClear() {
  dialog.warning({
    content: '确认清空全部定时任务运行日志吗？',
    draggable: true,
    negativeText: '取消',
    onPositiveClick: async () => {
      const data = await requestClient.post('/system/job/log/clear');
      message.success(`成功清空${data}条日志`);
      refreshTable();
    },
    positiveText: '确定',
    title: '清空运行日志',
  });
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
          <n-button class="mr-2" type="warning" @click="handleClear">
            清空
          </n-button>
        </n-flex>
      </template>
      <template #action="{ row }">
        <n-flex class="mx-2" justify="space-around" size="small">
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button ghost size="small" type="error">删除</n-button>
            </template>
            确认删除该运行日志吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
  </Page>
</template>
