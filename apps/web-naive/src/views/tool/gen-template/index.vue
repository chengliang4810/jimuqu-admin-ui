<script lang="ts" setup>
import { Page, useVbenModal } from '@vben/common-ui';

import { requestClient as request } from '#/api/request';

const message = useMessage();
const dialog = useDialog();

// import { getExampleTableApi } from '../mock-api';

interface RowType {
  category: string;
  color: string;
  id: string;
  price: string;
  productName: string;
  releaseDate: string;
}

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板名称',
      },
      fieldName: 'name',
      label: '模板名称',
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: true,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 30 },
    { title: '序号', type: 'seq', width: 50 },
    { field: 'id', title: '主键', visible: false },
    { field: 'name', title: '模板名称' },
    { field: 'path', title: '生成路径' },
    { field: 'remark', title: '备注' },
    { field: 'updateTime', formatter: 'formatDateTime', title: '最后更新时间' },
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
        return await request.get<null>('/tool/gen-template/list', {
          params: {
            pageNum: page.currentPage,
            pageSize: page.pageSize,
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
  headerCellConfig: {
    height: 44,
  },
  cellConfig: {
    height: 48,
  },
  rowConfig: {
    keyField: 'id',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 表单Model类型
type ModelType = 'add' | 'delete' | 'update';
const currentType: Ref<ModelType> = ref('add');

const currentModel = computed(() => {
  return modelData[currentType.value];
});
// 表单Model参数
const modelData: Record<ModelType, any> = {
  add: {
    title: '新增模板',
    url: '/tool/gen-template/add',
  },
  update: {
    title: '编辑模板',
    url: '/tool/gen-template/update',
  },
  delete: {
    title: '删除模板',
    url: '/tool/gen-template/delete',
  },
};

const [TemplateForm, templateFormApi] = useVbenForm({
  handleSubmit: onSubmit,
  schema: [
    {
      label: '主键',
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        // 使用css方式隐藏 但仍然可赋值
        show: () => false,
        // 注意这个一定要为['']  否则不能被正常隐藏
        triggerFields: [''],
      },
    },
    {
      label: '模板名称',
      fieldName: 'name',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入模板名称',
      },
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
      },
      fieldName: 'path',
      label: '文件路径',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      fieldName: 'enable',
      label: '状态',
      defaultValue: 1,
      componentProps: {
        options: [
          { value: 1, label: '启用' },
          { value: 0, label: '禁用' },
        ],
      },
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      componentProps: {
        type: 'textarea',
        placeholder: '请输入',
        autosize: { minRows: 20 },
      },
      fieldName: 'content',
      label: '模板内容',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注',
        clearable: true,
      },
    },
  ],
  showDefaultActions: false,
});

const [TemplateFormModel, templateFormModelApi] = useVbenModal({
  title: '编辑数据',
  appendToMain: true,
  fullscreen: true,
  onCancel() {
    templateFormModelApi.close();
  },
  onConfirm: async () => {
    await templateFormApi.validateAndSubmitForm();
    // templateFormModelApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { values } = templateFormModelApi.getData<Record<string, any>>();
      if (values) {
        templateFormApi.setValues(values);
      }
    }
  },
});

async function onSubmit(values: Record<string, any>) {
  const loading = message.loading(`正在${currentModel.value.title}中...`);
  templateFormModelApi.lock();
  await request
    .post(currentModel.value.url, { ...values, category: 'default' })
    .finally(() => {
      templateFormModelApi.unlock();
    });
  loading.destroy();
  message.success(`${currentModel.value.title}成功`);
  // 刷新列表
  await gridApi.reload();
  templateFormModelApi.close();
}

// 新增&修改模板表单弹窗
function openModal(modelType: ModelType, formData?: any) {
  currentType.value = modelType;
  templateFormModelApi
    .setData({
      values: formData || {},
    })
    .setState({ title: currentModel.value.title })
    .open();
}

/**
 * 删除选中的数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除提醒',
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
 * 删除模板
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await request.post(`${modelData.delete.url}/${id}`);
  message.success(`成功删除${data}条数据`);
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
          <n-button class="mr-2" type="primary" @click="openModal('add')">
            新增
          </n-button>
        </n-flex>
      </template>
      <template #action="{ row }">
        <n-flex class="mx-3" justify="space-around" size="small">
          <n-button
            type="info"
            size="small"
            @click="openModal('update', row)"
            ghost
          >
            编辑
          </n-button>
          <n-popconfirm @positive-click="handleDelete(row.id)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>

    <!-- 新增&修改模板表单 -->
    <TemplateFormModel>
      <TemplateForm />
    </TemplateFormModel>
  </Page>
</template>
