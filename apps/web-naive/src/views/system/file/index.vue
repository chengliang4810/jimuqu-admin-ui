<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { requestClient } from '#/api/request';

const message = useMessage();
const dialog = useDialog();

// 数据类型字段
interface FileVo {
  /** 文件id */
  id: string;
  /** 文件访问地址 */
  url: string;
  /** 文件大小，单位字节 */
  size: number;
  /** 文件名称 */
  filename: string;
  /** 原始文件名 */
  originalFilename: string;
  /** 基础存储路径 */
  basePath: string;
  /** 存储路径 */
  path: string;
  /** 文件扩展名 */
  ext: string;
  /** MIME类型 */
  contentType: string;
  /** 存储平台 */
  platform: string;
  /** 缩略图访问路径 */
  thUrl: string;
  /** 缩略图名称 */
  thFilename: string;
  /** 缩略图大小，单位字节 */
  thSize: number;
  /** 缩略图MIME类型 */
  thContentType: string;
  /** 文件所属对象id */
  objectId: string;
  /** 文件所属对象类型，例如用户头像，评价图片 */
  objectType: string;
  /** 文件元数据 */
  metadata: string;
  /** 文件用户元数据 */
  userMetadata: string;
  /** 缩略图元数据 */
  thMetadata: string;
  /** 缩略图用户元数据 */
  thUserMetadata: string;
  /** 附加属性 */
  attr: string;
  /** 文件ACL */
  fileAcl: string;
  /** 缩略图文件ACL */
  thFileAcl: string;
  /** 哈希信息 */
  hashInfo: string;
  /** 上传ID，仅在手动分片上传时使用 */
  uploadId: string;
  /** 上传状态，仅在手动分片上传时使用，1：初始化完成，2：上传完成 */
  uploadStatus: number;
  /** 创建时间 */
  createTime: string;
}

// 查询表单配置
const formOptions: VbenFormProps = {
  // 默认收起
  collapsed: true,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请选择文件所属对象类型',
      },
      fieldName: 'objectType',
      label: '所属对象类型',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件名称',
      },
      fieldName: 'filename',
      label: '文件名称',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件扩展名',
      },
      fieldName: 'ext',
      label: '文件扩展名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入存储平台',
      },
      fieldName: 'platform',
      label: '存储平台',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件所属对象id',
      },
      fieldName: 'objectId',
      label: '所属对象ID',
    },
    // TODO 文件大小区间查询
    // {
    //   component: 'Input',
    //   componentProps: {
    //     placeholder: '请输入文件大小，单位字节',
    //   },
    //   fieldName: 'size',
    //   label: '文件大小，单位字节',
    // },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件访问地址',
      },
      fieldName: 'url',
      label: '文件访问地址',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入原始文件名',
      },
      fieldName: 'originalFilename',
      label: '原始文件名',
    },
    {
      component: 'DatePicker',
      componentProps: {
        type: 'daterange',
        clearable: true,
        placeholder: '请输入上传时间',
      },
      fieldName: 'createTime',
      label: '上传时间',
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单进行搜索
  submitOnChange: false,
  // 按下回车时是否提交表单进行搜索
  submitOnEnter: true,
};

// 表格配置
const gridOptions: VxeGridProps<FileVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'id', title: '文件编号', visible: true },
    { field: 'url', title: '文件访问地址' },
    { field: 'size', title: '文件大小' },
    { field: 'filename', title: '文件名称' },
    { field: 'ext', title: '文件扩展名' },
    { field: 'contentType', title: 'MIME类型' },
    { field: 'platform', title: '存储平台' },
    { field: 'objectType', title: '所属对象类型' },
    { field: 'objectId', title: '所属对象id' },
    { field: 'createTime', formatter: 'formatDateTime', title: '上传时间' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 150,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return await requestClient.get<FileVo[]>('/system/file/list', {
          params: {
            currentPage,
            pageSize,
            ...formValues,
          },
        });
      },
    },
  },
  toolbarConfig: {
    // 是否显示搜索表单控制按钮
    // @ts-ignore 正式环境时有完整的类型声明
    custom: true,
    // import: true,
    refresh: true,
    zoom: true,
  },
  rowConfig: {
    keyField: 'id',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/**
 * 删除选中的文件记录数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的模板数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除文件记录提醒',
    content: `你确定要删除${records.length}条数据吗？`,
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: async () => {
      const ids = records.map((item) => item.id);
      await handleDelete(ids);
    },
  });
}

/**
 * 删除文件记录
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(`/system/file/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新文件记录表格数据
 */
async function refreshTable() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <n-flex class="mx-3" size="small">
          <!-- <n-button class="mr-2"> 导出 </n-button> -->
          <n-button class="mr-2" type="error" @click="handleDeleteCheck">
            删除
          </n-button>
        </n-flex>
      </template>
      <template #action="{ row }">
        <n-flex class="mx-3" justify="space-around" size="small">
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除该文件记录吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <TemplateFromModal @reload="refreshTable" />
  </Page>
</template>
