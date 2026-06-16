<script setup lang="ts">
import type { FormInstance } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { DictEnum } from '@/constants';
import { formatDateTime } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { Card, DateRangePicker, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface ConfigSearchFormParams {
  configName?: string;
  configKey?: string;
  configType?: string;
  time?: [Dayjs, Dayjs];
}

const model = ref<ConfigSearchFormParams>({
  configName: undefined,
  configKey: undefined,
  configType: undefined,
  time: undefined,
});

const formInstance = ref<FormInstance>();

function buildSearchParams(values: ConfigSearchFormParams) {
  const params: Record<string, any> = { ...values };
  if (params.time) {
    params.params = {
      beginTime: formatDateTime(params.time[0]),
      endTime: formatDateTime(params.time[1]),
    };
    Reflect.deleteProperty(params, 'time');
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
});
</script>

<template>
  <Card size="small">
    <Form
      ref="formInstance"
      :model="model"
      :label-col="{ style: { width: '100px' } }"
    >
      <div :class="tableSeachClass">
        <FormItem label="参数名称" name="configName">
          <FormInput v-model:value="model.configName" allow-clear />
        </FormItem>
        <FormItem label="参数键名" name="configKey">
          <FormInput v-model:value="model.configKey" allow-clear />
        </FormItem>
        <FormItem label="系统内置" name="configType">
          <FormSelect
            allow-clear
            v-model:value="model.configType"
            :options="getDictOptions(DictEnum.SYS_YES_NO)"
          />
        </FormItem>
        <FormItem label="创建时间" name="time">
          <DateRangePicker v-model:value="model.time" allow-clear />
        </FormItem>
      </div>
    </Form>

    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Card>
</template>
