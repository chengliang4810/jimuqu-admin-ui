<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { DictEnum } from '@/constants';
import { getDictOptions } from '@/utils/dict';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  noticeTitle?: string;
  createByName?: string;
  noticeType?: string;
}

const model = ref<SearchParams>({
  noticeTitle: undefined,
  createByName: undefined,
  noticeType: undefined,
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
        <FormItem label="公告标题" name="noticeTitle">
          <FormInput v-model:value="model.noticeTitle" allow-clear />
        </FormItem>
        <FormItem label="创建人" name="createByName">
          <FormInput v-model:value="model.createByName" allow-clear />
        </FormItem>
        <FormItem label="公告类型" name="noticeType">
          <FormSelect
            allow-clear
            v-model:value="model.noticeType"
            :options="getDictOptions(DictEnum.SYS_NOTICE_TYPE)"
          />
        </FormItem>
      </div>
    </Form>

    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Card>
</template>
