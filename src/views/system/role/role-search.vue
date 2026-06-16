<script setup lang="ts">
import type { FormInstance } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { DictEnum } from '@/constants';
import { formatDateTime } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { Card, DateRangePicker, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  roleName?: string;
  roleKey?: string;
  status?: string;
  createTime?: [Dayjs, Dayjs];
}

const model = ref<SearchParams>({
  roleName: undefined,
  roleKey: undefined,
  status: undefined,
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
        <FormItem label="角色名称" name="roleName">
          <FormInput v-model:value="model.roleName" allow-clear />
        </FormItem>
        <FormItem label="权限字符" name="roleKey">
          <FormInput v-model:value="model.roleKey" allow-clear />
        </FormItem>
        <FormItem label="状态" name="status">
          <FormSelect
            allow-clear
            v-model:value="model.status"
            :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
          />
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
