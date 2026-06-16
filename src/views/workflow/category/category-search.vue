<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  categoryName?: string;
  categoryCode?: string;
}

const model = ref<SearchParams>({
  categoryName: undefined,
  categoryCode: undefined,
});

const formInstance = ref<FormInstance>();

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
      ref="formInstance"
      :model="model"
      :label-col="{ style: { width: '80px' } }"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <FormItem label="分类名称" name="categoryName">
          <FormInput v-model:value="model.categoryName" allow-clear />
        </FormItem>
        <FormItem label="分类编码" name="categoryCode">
          <FormInput v-model:value="model.categoryCode" allow-clear />
        </FormItem>
      </div>
    </Form>

    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Card>
</template>
