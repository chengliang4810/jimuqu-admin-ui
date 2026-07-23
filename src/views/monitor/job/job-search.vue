<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

const model = ref({
  enabled: undefined as string | undefined,
  jobName: '',
});
const formInstance = ref<FormInstance>();

async function getValues() {
  return { ...model.value };
}

async function handleSubmit() {
  await formInstance.value?.validate();
  emit('submit', await getValues());
}

function handleReset() {
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
      :label-col="{ style: { width: '80px' } }"
      :model="model"
      @keydown.enter.prevent="handleSubmit"
    >
      <div :class="tableSeachClass">
        <FormItem label="任务名称" name="jobName">
          <FormInput v-model:value="model.jobName" allow-clear />
        </FormItem>
        <FormItem label="任务状态" name="enabled">
          <FormSelect
            v-model:value="model.enabled"
            allow-clear
            :options="[
              { label: '运行中', value: '0' },
              { label: '已停止', value: '1' },
            ]"
          />
        </FormItem>
        <div class="[grid-column-end:-1] flex items-baseline justify-end gap-4">
          <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
        </div>
      </div>
    </Form>
  </Card>
</template>
