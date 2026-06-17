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
import { Card, DateRangePicker, Form, FormItem, Space } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface UserSearchFormParams {
  userName?: string;
  nickName?: string;
  phoneNumber?: string;
  status?: string;
  createTime?: [Dayjs, Dayjs];
}

const model = ref<UserSearchFormParams>({
  userName: undefined,
  nickName: undefined,
  phoneNumber: undefined,
  status: undefined,
  createTime: undefined,
});

const formInstance = ref<FormInstance>();
const searchCollapsed = ref(false);

function toggleCollapse() {
  searchCollapsed.value = !searchCollapsed.value;
}

function buildSearchParams(values: UserSearchFormParams) {
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
      :label-col="{ style: { width: '100px' } }"
    >
      <div :class="tableSeachClass">
        <template v-if="!searchCollapsed">
          <FormItem label="用户账号" name="userName">
            <FormInput v-model:value="model.userName" allow-clear />
          </FormItem>
          <FormItem label="用户昵称" name="nickName">
            <FormInput v-model:value="model.nickName" allow-clear />
          </FormItem>
          <FormItem label="手机号码" name="phoneNumber">
            <FormInput v-model:value="model.phoneNumber" allow-clear />
          </FormItem>
          <FormItem label="用户状态" name="status">
            <FormSelect
              allow-clear
              v-model:value="model.status"
              :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
            />
          </FormItem>
          <FormItem label="创建时间" name="createTime">
            <DateRangePicker v-model:value="model.createTime" allow-clear />
          </FormItem>
        </template>
        <!-- [grid-column-end:-1] 始终定位到最后一列，justify-self-end 靠右对齐 -->
        <div class="[grid-column-end:-1] justify-self-end">
          <Space>
            <a-button @click="toggleCollapse">
              {{
                searchCollapsed
                  ? $t('pages.common.expand')
                  : $t('pages.common.collapse')
              }}
            </a-button>
            <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
          </Space>
        </div>
      </div>
    </Form>
  </Card>
</template>
