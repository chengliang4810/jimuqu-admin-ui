<script setup lang="ts">
import type { GenInfo } from '@/api/tool/gen/model';
import type { VxeGridInstance } from 'vxe-table';

import type { Ref } from 'vue';

import { inject, onMounted, reactive, useTemplateRef } from 'vue';

import { withDefaultVxeGridOptions } from '@/components/vxe-table';
import { dictOptionSelectList } from '@/api/system/dict/dict-type';
import { VxeGrid } from 'vxe-table';

import { validRules, vxeTableColumns } from './gen-data';

/**
 * 从父组件注入
 */
const genInfoData = inject('genInfoData') as Ref<GenInfo['info']>;

const dictOptions = reactive<{ label: string; value: string }[]>([
  { label: '未设置', value: '' },
]);

/**
 * 加载字典下拉数据
 */
onMounted(async () => {
  const resp = await dictOptionSelectList();

  const options = resp.map((dict) => ({
    label: `${dict.dictName} | ${dict.dictType}`,
    value: dict.dictType,
  }));

  dictOptions.push(...options);
});

const gridOptions = withDefaultVxeGridOptions({
  columns: vxeTableColumns(dictOptions),
  keepSource: true,
  editConfig: { trigger: 'click', mode: 'cell', showStatus: true },
  editRules: validRules,
  rowConfig: {
    keyField: 'id',
    isCurrent: true, // 高亮当前行
  },
  columnConfig: {
    resizable: true,
  },
  proxyConfig: {
    enabled: true,
  },
  toolbarConfig: {
    enabled: false,
  },
  height: 'auto',
  pagerConfig: {
    enabled: false,
  },
  data: genInfoData.value.columns,
});

const tableRef = useTemplateRef<VxeGridInstance>('tableRef');

/**
 * 校验表格数据
 */
async function validateTable() {
  const hasError = await tableRef.value?.validate();
  return !hasError;
}

/**
 * 获取表格数据
 */
function getTableRecords() {
  return tableRef.value?.getData?.() ?? [];
}

defineExpose({
  validateTable,
  getTableRecords,
});
</script>

<template>
  <div class="flex flex-col gap-[16px]">
    <div class="h-[calc(100vh-200px)] overflow-y-hidden">
      <VxeGrid ref="tableRef" v-bind="gridOptions" />
    </div>
  </div>
</template>
