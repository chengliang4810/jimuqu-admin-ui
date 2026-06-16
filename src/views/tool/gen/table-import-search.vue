<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  dataName?: string;
  tableName?: string;
  tableComment?: string;
}

const model = ref<SearchParams>({
  dataName: 'master',
  tableName: undefined,
  tableComment: undefined,
});

const formInstance = ref<FormInstance>();

interface SelectOption {
  label: string;
  value: string;
}

const props = defineProps<{
  dataSourceOptions?: SelectOption[];
}>();

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
  <Form
    ref="formInstance"
    :model="model"
    :label-col="{ style: { width: '60px' } }"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <FormItem label="数据源" name="dataName">
        <FormSelect
          v-model:value="model.dataName"
          :options="props.dataSourceOptions ?? []"
        />
      </FormItem>
      <FormItem label="表名称" name="tableName">
        <FormInput v-model:value="model.tableName" allow-clear />
      </FormItem>
      <FormItem label="表描述" name="tableComment">
        <FormInput v-model:value="model.tableComment" allow-clear />
      </FormItem>
    </div>
    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Form>
</template>
