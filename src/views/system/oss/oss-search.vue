<script setup lang="ts">
import type { FormInstance } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import { ref } from 'vue';

import { FormInput } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { ChevronDown } from '@/icons-app';
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
const searchCollapsed = ref(false);

function toggleCollapse() {
  searchCollapsed.value = !searchCollapsed.value;
}

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
        </template>
        <!-- [grid-column-end:-1] 始终定位到最后一列，justify-self-end 靠右对齐 -->
        <div class="[grid-column-end:-1] flex items-center justify-end gap-4">
          <a-button type="link" @click="toggleCollapse">
            {{
              searchCollapsed
                ? $t('pages.common.expand')
                : $t('pages.common.collapse')
            }}
            <ChevronDown
              class="size-4 transition-transform"
              :class="{ 'rotate-180': !searchCollapsed }"
            />
          </a-button>
          <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
        </div>
      </div>
    </Form>
  </Card>
</template>
