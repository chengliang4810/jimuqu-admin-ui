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
  menuName?: string;
  status?: string;
  visible?: string;
}

const model = ref<SearchParams>({
  menuName: undefined,
  status: undefined,
  visible: undefined,
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
        <FormItem label="菜单名称" name="menuName">
          <FormInput v-model:value="model.menuName" allow-clear />
        </FormItem>
        <FormItem label="菜单状态" name="status">
          <FormSelect
            allow-clear
            v-model:value="model.status"
            :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
          />
        </FormItem>
        <FormItem label="显示状态" name="visible">
          <FormSelect
            allow-clear
            v-model:value="model.visible"
            :options="getDictOptions(DictEnum.SYS_SHOW_HIDE)"
          />
        </FormItem>
      </div>
    </Form>

    <div class="flex items-center justify-end">
      <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
    </div>
  </Card>
</template>
