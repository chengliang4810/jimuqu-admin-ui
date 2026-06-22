<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInputNumber } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  startLeaveDays?: number;
  endLeaveDays?: number;
}

const model = ref<SearchParams>({
  startLeaveDays: undefined,
  endLeaveDays: undefined,
});

const formInstance = ref<FormInstance>();
const searchCollapsed = ref(false);

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
      <div :class="tableSeachClass">
        <template v-if="!searchCollapsed">
          <FormItem label="请假天数" name="startLeaveDays">
            <FormInputNumber
              v-model:value="model.startLeaveDays"
              :min="1"
              allow-clear
            />
          </FormItem>
          <FormItem label="至" name="endLeaveDays">
            <FormInputNumber
              v-model:value="model.endLeaveDays"
              :min="1"
              allow-clear
            />
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
