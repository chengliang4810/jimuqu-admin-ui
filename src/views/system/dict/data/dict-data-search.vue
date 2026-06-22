<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { cn } from '@/utils';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  dictLabel?: string;
}

const model = ref<SearchParams>({
  dictLabel: undefined,
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
      <div :class="cn(tableSeachClass, 'lg:grid-cols-2 xl:grid-cols-2')">
        <template v-if="!searchCollapsed">
          <FormItem label="字典标签" name="dictLabel">
            <FormInput v-model:value="model.dictLabel" allow-clear />
          </FormItem>
        </template>
        <!-- [grid-column-end:-1] 始终定位到最后一列，justify-self-end 靠右对齐 -->
        <div class="[grid-column-end:-1] flex items-baseline justify-end gap-4">
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
