<script lang="ts" setup>
import type { FormType } from './form-modal.vue';

import { useVbenModal } from '@vben/common-ui';

import { requestClient } from '#/api/request';

import { emitter } from '../mitt';
import formModal from './form-modal.vue';

const message = useMessage();
const dialog = useDialog();

// 数据类型字段
interface DictDataVo {
  /** 字典ID */
  id: string;
  /** 父级ID */
  parentId: string;
  /** 字典排序 */
  dictSort: number;
  /** 字典标签 */
  dictLabel: string;
  /** 字典键值 */
  dictValue: string;
  /** 字典类型 */
  dictTypeKey: string;
  /** 样式属性（其他样式扩展） */
  cssClass: string;
  /** 表格回显样式 */
  listClass: string;
  /** 是否默认（Y是 N否） */
  isDefault: string;
  /** 备注 */
  remark: string;
}

// 查询表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
      },
      fieldName: 'dictLabel',
      label: '字典标签',
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: false,
  submitButtonOptions: {
    content: '查询',
  },
  // 是否在字段值改变时提交表单进行搜索
  submitOnChange: false,
  // 按下回车时是否提交表单进行搜索
  submitOnEnter: true,
};

// 表格配置
const gridOptions: VxeGridProps<DictDataVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'id', title: '字典ID', visible: false },
    { field: 'parentId', title: '父级ID', visible: false },
    { field: 'dictLabel', title: '标签' },
    { field: 'dictValue', title: '字典值' },
    { field: 'dictSort', title: '排序' },
    { field: 'dictTypeKey', title: '字典类型', visible: false },
    { field: 'cssClass', title: '样式属性', visible: false },
    { field: 'listClass', title: '表格回显样式', visible: false },
    { field: 'isDefault', title: '是否默认' },
    { field: 'remark', title: '备注', visible: false },
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
        if (dictKey.value) {
          formValues.dictTypeKey = dictKey.value;
        }
        return await requestClient.get<DictDataVo[]>('/system/dict/data/list', {
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

// 字典数据表单弹窗
const [TemplateFromModal, formModelApi] = useVbenModal({
  connectedComponent: formModal,
});

function openModal(formType: FormType, row?: DictDataVo) {
  formModelApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

/**
 * 删除选中的字典数据数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的模板数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除字典数据提醒',
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
 * 删除字典数据
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(`/system/dict/data/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新字典数据表格数据
 */
async function refreshTable() {
  gridApi.reload();
}

const dictKey = ref('');
emitter.on('rowClick', async (value) => {
  dictKey.value = value;
  await gridApi.query();
});
</script>

<template>
  <div>
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
            确认删除该字典数据吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <TemplateFromModal @reload="refreshTable" />
  </div>
</template>
