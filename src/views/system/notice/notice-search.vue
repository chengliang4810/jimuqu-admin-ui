<script setup lang="ts">
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { FormInput, FormSelect } from '@/components/global/form';
import { SearchButtonGroup } from '@/components/table';
import { tableSeachClass } from '@/components/vxe-table';
import { DictEnum } from '@/constants';
import { ChevronDown } from '@/icons';
import { getDictOptions } from '@/utils/dict';
import { Card, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{
  reset: [];
  submit: [record: Record<string, any>];
}>();

interface SearchParams {
  noticeTitle?: string;
  createByName?: string;
  noticeType?: string;
}

const model = ref<SearchParams>({
  noticeTitle: undefined,
  createByName: undefined,
  noticeType: undefined,
});

const formInstance = ref<FormInstance>();
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
      :label-col="{ style: { width: '80px' } }"
    >
      <div :class="tableSeachClass">
        <template v-if="!searchCollapsed">
          <FormItem label="公告标题" name="noticeTitle">
            <FormInput v-model:value="model.noticeTitle" allow-clear />
          </FormItem>
          <FormItem label="创建人" name="createByName">
            <FormInput v-model:value="model.createByName" allow-clear />
          </FormItem>
          <FormItem label="公告类型" name="noticeType">
            <FormSelect
              allow-clear
              v-model:value="model.noticeType"
              :options="getDictOptions(DictEnum.SYS_NOTICE_TYPE)"
            />
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
