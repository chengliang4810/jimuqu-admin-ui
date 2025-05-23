<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';

import { requestClient as request } from '#/api/request';

const emit = defineEmits<{ reload: [] }>();

interface RowType {
  category: string;
  color: string;
  id: string;
  price: string;
  productName: string;
  releaseDate: string;
}

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: handleSubmit,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      tableApi.grid.clearCheckboxRow();
      return null;
    }
  },
});

/**
 * 导入表
 */
async function handleSubmit() {
  try {
    const records = tableApi.grid.getCheckboxRecords();
    const tables = records.map((item) => item.tableName);
    if (tables.length === 0) {
      modalApi.close();
      return;
    }
    modalApi.lock(true);
    const { dataName } = await tableApi.formApi.getValues();
    await request.post(
      `/tool/gen-code/import-table?tables=${tables}&dataName=${dataName}`,
    );
    emit('reload');
    modalApi.close();
  } catch (error) {
    console.warn(error);
  } finally {
    modalApi.unlock();
  }
}

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          {
            label: '默认数据源',
            value: 'master',
          },
        ],
        placeholder: '请选择',
      },
      defaultValue: 'master',
      fieldName: 'dataName',
      label: '数据源',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入表名',
      },
      fieldName: 'tableName',
      label: '表名',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入表描述',
      },
      fieldName: 'tableComment',
      label: '表描述',
    },
  ],
  commonConfig: {
    labelWidth: 60,
  },
  // 按下回车时是否提交表单
  submitOnEnter: true,
  showCollapseButton: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
};

const gridOptions: VxeGridProps<RowType> = {
  checkboxConfig: {
    highlight: true,
    reserve: true,
    trigger: 'row',
  },
  columns: [
    { align: 'left', title: '', type: 'checkbox', width: 30 },
    { title: '序号', type: 'seq', width: 50 },
    { field: 'tableName', title: '表名' },
    { field: 'tableComment', title: '描述' },
    { field: 'createTime', formatter: 'formatDateTime', title: '创建时间' },
    { field: 'updateTime', formatter: 'formatDateTime', title: '更新时间' },
  ],
  minHeight: 400,
  keepSource: true,
  size: 'small',
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const { currentPage, pageSize } = page;
        return request.get<RowType[]>('/tool/gen-code/db-list', {
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
    keyField: 'tableId',
  },
  toolbarConfig: {
    enabled: false,
  },
};

const [BasicTable, tableApi] = useVbenVxeGrid({ formOptions, gridOptions });
</script>
<template>
  <Modal class="w-[800px]" title="导入表">
    <BasicTable />
  </Modal>
</template>
