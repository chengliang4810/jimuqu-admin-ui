<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { cn } from '@/utils';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  viewSpel?: string;
}

const model = ref<SearchParams>({
  viewSpel: undefined,
});

const formInstance = ref<FormInstance>();
const searchCollapsed = ref(false);

// import { tableSeachClass } from '@/components/vxe-table';
// 搜索表单元素比较少，可以自定义样式 grid-cols-1，区别全局样式
const tableSeachClass = cn(
  'table-search-grid',
  'grid grid-cols-1 md:grid-cols-2',
  'gap-x-4 gap-y-6',
);

function buildSearchParams(values: SearchParams) {
  return { ...values };
}

async function getValues() {
  return buildSearchParams(model.value);
}

async function handleSubmit() {
  await formInstance.value?.validate();
  emit('submit', await getValues());
}

async function handleReset() {
  formInstance.value?.resetFields();
  emit('reset');
}

defineExpose({
  getValues,
  resetFields: () => formInstance.value?.resetFields(),
});
</script>

<template>
  <Card size="small">
    <Form
      @keydown.enter.prevent="handleSubmit"
      ref="formInstance"
      :model="model"
      :label-col="{ style: { width: '80px' } }"
    >
      <div :class="tableSeachClass">
        <template v-if="!searchCollapsed">
          <FormItem label="SpEL表达式" name="componentName">
            <FormInput v-model:value="model.viewSpel" allow-clear />
          </FormItem>
        </template>
        <!-- [grid-column-end:-1] 始终定位到最后一列，justify-self-end 靠右对齐 -->
        <div class="[grid-column-end:-1] flex items-baseline justify-end gap-4">
          <SearchButtonGroup
            v-model:collapsed="searchCollapsed"
            @reset="handleReset"
            @submit="handleSubmit"
          />
        </div>
      </div>
    </Form>
  </Card>
</template>
