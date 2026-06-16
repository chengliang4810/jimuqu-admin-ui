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
  ipaddr?: string;
  userName?: string;
  status?: string;
  dateTime?: [Dayjs, Dayjs];
}

const model = ref<SearchParams>({
  ipaddr: undefined,
  userName: undefined,
  status: undefined,
  dateTime: undefined,
});

const formInstance = ref<FormInstance>();

function buildSearchParams(values: SearchParams) {
  const params: Record<string, any> = { ...values };
  if (params.dateTime) {
    params.params = {
      beginTime: formatDateTime(params.dateTime[0]),
      endTime: formatDateTime(params.dateTime[1]),
    };
    Reflect.deleteProperty(params, 'dateTime');
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
        <FormItem label="IP地址" name="ipaddr">
          <FormInput v-model:value="model.ipaddr" allow-clear />
        </FormItem>
        <FormItem label="用户账号" name="userName">
          <FormInput v-model:value="model.userName" allow-clear />
        </FormItem>
        <FormItem label="登录状态" name="status">
          <FormSelect
            allow-clear
            v-model:value="model.status"
            :options="getDictOptions(DictEnum.SYS_COMMON_STATUS)"
          />
        </FormItem>
        <FormItem label="登录日期" name="dateTime">
          <DateRangePicker v-model:value="model.dateTime" allow-clear />
        </FormItem>
      </div>
    </Form>

    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Card>
</template>
