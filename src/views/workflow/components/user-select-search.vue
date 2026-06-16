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
  userName?: string;
}

const model = ref<SearchParams>({
  userName: undefined,
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
  <Form
    ref="formInstance"
    :model="model"
    :label-col="{ style: { width: '80px' } }"
  >
    <div class="grid grid-cols-2">
      <FormItem label="用户账号" name="userName">
        <FormInput v-model:value="model.userName" allow-clear placeholder="请输入账号" />
      </FormItem>
    </div>
    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Form>
</template>
