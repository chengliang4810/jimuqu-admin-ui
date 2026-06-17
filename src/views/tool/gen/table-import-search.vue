<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { Card, Form, FormItem, Space } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  dataName?: string;
  tableName?: string;
  tableComment?: string;
}

const model = ref<SearchParams>({
  dataName: 'master',
  tableName: undefined,
  tableComment: undefined,
});

const formInstance = ref<FormInstance>();

interface SelectOption {
  label: string;
  value: string;
}

const props = defineProps<{
  dataSourceOptions?: SelectOption[];
}>();

const searchCollapsed = ref(false);

function toggleCollapse() {
  searchCollapsed.value = !searchCollapsed.value;
}

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
      :label-col="{ style: { width: '60px' } }"
    >
      <div :class="tableSeachClass">
        <template v-if="!searchCollapsed">
          <FormItem label="数据源" name="dataName">
            <FormSelect
              v-model:value="model.dataName"
              :options="props.dataSourceOptions ?? []"
            />
          </FormItem>
          <FormItem label="表名称" name="tableName">
            <FormInput v-model:value="model.tableName" allow-clear />
          </FormItem>
          <FormItem label="表描述" name="tableComment">
            <FormInput v-model:value="model.tableComment" allow-clear />
          </FormItem>
        </template>
        <!-- [grid-column-end:-1] 始终定位到最后一列，justify-self-end 靠右对齐 -->
        <div class="[grid-column-end:-1] justify-self-end">
          <Space>
            <a-button @click="toggleCollapse">
              {{ searchCollapsed ? $t('pages.common.expand') : $t('pages.common.collapse') }}
            </a-button>
            <SearchButtonGroup @reset="handleReset" @submit="handleSubmit" />
          </Space>
        </div>
      </div>
    </Form>
  </Card>
</template>
