<script setup lang="ts">
import type { FormInstance } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import { ref } from 'vue';

import { FormInput } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { formatDateTime } from '@/utils';
import { Card, DateRangePicker, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  fileName?: string;
  originalName?: string;
  fileSuffix?: string;
  service?: string;
  createTime?: [Dayjs, Dayjs];
}

const model = ref<SearchParams>({
  fileName: undefined,
  originalName: undefined,
  fileSuffix: undefined,
  service: undefined,
  createTime: undefined,
});

const formInstance = ref<FormInstance>();

function buildSearchParams(values: SearchParams) {
  const params: Record<string, any> = { ...values };
  if (params.createTime) {
    params.params = {
      beginTime: formatDateTime(params.createTime[0]),
      endTime: formatDateTime(params.createTime[1]),
    };
    Reflect.deleteProperty(params, 'createTime');
  }
  return params;
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
        <FormItem label="文件名" name="fileName">
          <FormInput v-model:value="model.fileName" allow-clear />
        </FormItem>
        <FormItem label="原名" name="originalName">
          <FormInput v-model:value="model.originalName" allow-clear />
        </FormItem>
        <FormItem label="拓展名" name="fileSuffix">
          <FormInput v-model:value="model.fileSuffix" allow-clear />
        </FormItem>
        <FormItem label="服务商" name="service">
          <FormInput v-model:value="model.service" allow-clear />
        </FormItem>
        <FormItem label="创建时间" name="createTime">
          <DateRangePicker v-model:value="model.createTime" allow-clear />
        </FormItem>
      </div>
    </Form>

    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Card>
</template>
