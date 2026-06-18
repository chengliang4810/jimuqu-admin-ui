<script setup lang="ts">
import type { FormInstance } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { DictEnum } from '@/constants';
import { ChevronDown } from '@/icons-app';
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
const searchCollapsed = ref(false);

function toggleCollapse() {
  searchCollapsed.value = !searchCollapsed.value;
}

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
      <div :class="tableSeachClass">
        <template v-if="!searchCollapsed">
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
