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

interface SearchParams {
  title?: string;
  operName?: string;
  businessType?: string;
  operIp?: string;
  status?: string;
  createTime?: [Dayjs, Dayjs];
}

const model = ref<SearchParams>({
  title: undefined,
  operName: undefined,
  businessType: undefined,
  operIp: undefined,
  status: undefined,
  createTime: undefined,
});

const formInstance = ref<FormInstance>();
const searchCollapsed = ref(false);

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
      <div :class="tableSeachClass">
        <template v-if="!searchCollapsed">
          <FormItem label="系统模块" name="title">
            <FormInput v-model:value="model.title" allow-clear />
          </FormItem>
          <FormItem label="操作人员" name="operName">
            <FormInput v-model:value="model.operName" allow-clear />
          </FormItem>
          <FormItem label="操作类型" name="businessType">
            <FormSelect
              allow-clear
              v-model:value="model.businessType"
              :options="getDictOptions(DictEnum.SYS_OPER_TYPE)"
            />
          </FormItem>
          <FormItem label="操作IP" name="operIp">
            <FormInput v-model:value="model.operIp" allow-clear />
          </FormItem>
          <FormItem label="状态" name="status">
            <FormSelect
              allow-clear
              v-model:value="model.status"
              :options="getDictOptions(DictEnum.SYS_COMMON_STATUS)"
            />
          </FormItem>
          <FormItem label="操作时间" name="createTime">
            <DateRangePicker v-model:value="model.createTime" allow-clear />
          </FormItem>
        </template>
        <!-- [grid-column-end:-1] 始终定位到最后一列，justify-self-end 靠右对齐 -->
        <div class="[grid-column-end:-1] flex items-center justify-end gap-4">
          <SearchButtonGroup
            collapsible
            v-model:collapsed="searchCollapsed"
            @reset="handleReset"
            @submit="handleSubmit"
          />
        </div>
      </div>
    </Form>
  </Card>
</template>
