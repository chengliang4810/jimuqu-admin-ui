<script lang="ts" setup>
import type { FormType } from './form-modal.vue';

import { useVbenModal } from '@vben/common-ui';

import { requestClient } from '#/api/request';

import { emitter } from '../mitt';
import formModal from './form-modal.vue';

const message = useMessage();
const dialog = useDialog();

// 数据类型字段
interface DictTypeVo {
  /** 字典主键 */
  dictId: string;
  /** 字典key */
  dictKey: string;
  /** 字典名称 */
  dictName: string;
  /** 字典类型 L 列表 T 树 */
  dictType: string;
  /** 备注 */
  remark: string;
}

// 查询表单配置
const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  commonConfig: {
    labelWidth: 70,
    componentProps: {
      allowClear: true,
    },
  },
  schema: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
      },
      fieldName: 'dictKey',
      label: '字典标识',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入',
      },
      fieldName: 'dictName',
      label: '字典名称',
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
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
const gridOptions: VxeGridProps<DictTypeVo> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 40 },
    { field: 'dictId', title: '字典主键', visible: false },
    { field: 'dictKey', title: '字典标识' },
    { field: 'dictName', title: '字典名称' },
    { field: 'dictType', title: '字典类型 L 列表 T 树', visible: false },
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
        return await requestClient.get<DictTypeVo[]>('/system/dict/type/list', {
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
    keyField: 'dictId',
    // 高亮当前行
    isCurrent: true,
  },
  rowClassName: 'hover:cursor-pointer',
};

const lastDictKey = ref('');
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
  gridEvents: {
    cellClick: (e: any) => {
      const { row } = e;
      if (lastDictKey.value === row.dictKey) {
        return;
      }
      emitter.emit('rowClick', row.dictKey);
      lastDictKey.value = row.dictKey;
    },
  },
});

// 字典类型表单弹窗
const [TemplateFromModal, formModelApi] = useVbenModal({
  connectedComponent: formModal,
});

function openModal(formType: FormType, row?: DictTypeVo) {
  formModelApi
    .setData({
      formType,
      row: row || {},
    })
    .open();
}

/**
 * 删除选中的字典类型数据
 */
async function handleDeleteCheck() {
  const records = gridApi.grid.getCheckboxRecords();
  if (records.length <= 0) {
    message.warning('请选择要删除的模板数据');
    return;
  }

  // 确认删除
  dialog.warning({
    title: '删除字典类型提醒',
    content: `你确定要删除${records.length}条数据吗？`,
    positiveText: '确定',
    negativeText: '取消',
    draggable: true,
    onPositiveClick: async () => {
      const ids = records.map((item) => item.dictId);
      await handleDelete(ids);
    },
  });
}

/**
 * 删除字典类型
 * @param id 主键，主键数组
 */
async function handleDelete(id: string | string[]) {
  const data = await requestClient.post(`/system/dictType/delete/${id}`);
  message.success(`成功删除${data}条数据`);
  refreshTable();
}

/**
 * 刷新字典类型表格数据
 */
async function refreshTable() {
  gridApi.reload();
}
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
          <n-popconfirm @positive-click="handleDelete(row.dictId)">
            <template #trigger>
              <n-button type="error" size="small" ghost>删除</n-button>
            </template>
            确认删除该字典类型吗？
          </n-popconfirm>
        </n-flex>
      </template>
    </Grid>
    <TemplateFromModal @reload="refreshTable" />
  </div>
</template>
