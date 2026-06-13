<script lang="tsx" setup>
import type { FormType } from './form-modal.vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { NTag } from 'naive-ui';

import { downloadFile, requestClient } from '#/api/request';

import formModal from './form-modal.vue';

const message = useMessage();
const dialog = useDialog();
const uploadRef = ref<HTMLInputElement>();

interface PluginVo {
  id: string;
  pluginKey: string;
  pluginName: string;
  version: string;
  author: string;
  pluginType: string;
  entryClass: string;
  status: number;
  packagePath: string;
  descriptorPath: string;
  description: string;
  createTime: string;
  updateTime: string;
}

const statusOptions = [
  { label: '启用', value: 0 },
  { label: '停用', value: 1 },
];

const pluginTypeOptions = [
  { label: '本地插件', value: 'local' },
  { label: '插件包', value: 'package' },
  { label: '业务扩展', value: 'extension' },
];

function renderStatus(status: number) {
  return status === 0 ? (
    <NTag type="success">启用</NTag>
  ) : (
    <NTag type="warning">停用</NTag>
  );
}

function renderType(type: string) {
  const option = pluginTypeOptions.find((item) => item.value === type);
  return <NTag type="info">{option?.label || type || '未设置'}</NTag>;
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入插件编码',
      },
      fieldName: 'pluginKey',
      label: '插件编码',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入插件名称',
      },
      fieldName: 'pluginName',
      label: '插件名称',
    },
    {
      component: 'Select',
      componentProps: {
        options: pluginTypeOptions,
      },
      fieldName: 'pluginType',
      label: '插件类型',
    },
    {
      component: 'Select',
      componentProps: {
        options: statusOptions,
      },
      fieldName: 'status',
      label: '状态',
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

const gridOptions: VxeGridProps<PluginVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'id', title: '插件ID', width: 100 },
    { field: 'pluginKey', title: '插件编码', minWidth: 150 },
    { field: 'pluginName', title: '插件名称', minWidth: 160 },
    { field: 'version', title: '版本', width: 100 },
    { field: 'author', title: '作者', width: 120 },
    {
      field: 'pluginType',
      title: '插件类型',
      width: 110,
      slots: {
        default: ({ row }) => renderType(row.pluginType),
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: {
        default: ({ row }) => renderStatus(row.status),
      },
    },
    { field: 'entryClass', title: '入口类', minWidth: 240 },
    { field: 'description', title: '描述', minWidth: 220 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 290,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return await requestClient.get<PluginVo[]>('/system/plugin/list', {
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

const [PluginFormModal, pluginFormModalApi] = useVbenModal({
  connectedComponent: formModal,
});

function openModal(formType: FormType, row?: PluginVo) {
  pluginFormModalApi
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
  const data = await requestClient.post(`/system/plugin/delete/${ids}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的插件');
    return;
  }

  dialog.warning({
    content: `确认删除 ${records.length} 个插件吗？`,
    draggable: true,
    negativeText: '取消',
    onPositiveClick: async () => {
      await handleDelete(records.map((item) => item.id));
    },
    positiveText: '确定',
    title: '删除在线插件',
  });
}

async function updatePluginStatus(row: PluginVo) {
  const nextStatus = row.status === 0 ? 1 : 0;
  await requestClient.post(`/system/plugin/status/${row.id}/${nextStatus}`);
  message.success(nextStatus === 0 ? '插件已启用' : '插件已停用');
  refreshTable();
}

async function scanPlugins() {
  const count = await requestClient.post<number>('/system/plugin/scan');
  message.success(`扫描完成，发现 ${count} 个描述文件`);
  refreshTable();
}

async function downloadTemplate() {
  await downloadFile('/system/plugin/template', 'jimuqu-plugin-template.zip');
}

function openUpload() {
  uploadRef.value?.click();
}

async function uploadPlugin(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  const formData = new FormData();
  formData.append('file', file);
  await requestClient.post('/system/plugin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  message.success('插件包上传成功');
  refreshTable();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <input
            ref="uploadRef"
            accept=".jar,.zip"
            class="hidden"
            type="file"
            @change="uploadPlugin"
          />
          <n-button class="mr-2" type="error" @click="handleDeleteCheck">
            删除
          </n-button>
          <n-button class="mr-2" type="primary" @click="openModal('add')">
            新增
          </n-button>
          <n-button class="mr-2" type="info" @click="scanPlugins">
            扫描
          </n-button>
          <n-button class="mr-2" type="success" @click="openUpload">
            上传插件包
          </n-button>
          <n-button
            class="mr-2"
            secondary
            type="primary"
            @click="downloadTemplate"
          >
            开发模板
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
            ghost
            size="small"
            :type="row.status === 0 ? 'warning' : 'success'"
            @click="updatePluginStatus(row)"
          >
            {{ row.status === 0 ? '停用' : '启用' }}
          </n-button>
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button ghost size="small" type="error">删除</n-button>
            </template>
            确认删除该在线插件吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <PluginFormModal @reload="refreshTable" />
  </Page>
</template>
