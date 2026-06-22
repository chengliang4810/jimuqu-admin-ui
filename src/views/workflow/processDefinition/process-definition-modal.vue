<script setup lang="ts">
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { categoryTree } from '@/api/workflow/category';
import {
  workflowDefinitionAdd,
  workflowDefinitionInfo,
  workflowDefinitionUpdate,
} from '@/api/workflow/definition';
import { useVbenModal } from '@/components';
import {
  FormInput as Input,
  FormTreeSelect as TreeSelect,
} from '@/components/global/form';
import { $t } from '@/locales';
import { addFullName, cloneDeep, getPopupContainer } from '@/utils';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

import { designerModeOptions } from './data';

const emit = defineEmits<{ reload: [type: 'add' | 'update'] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

interface FormData {
  category?: string;
  flowCode?: string;
  flowName?: string;
  formPath?: string;
  id?: number | string;
  modelValue?: string;
}

function getDefaultValues(): FormData {
  return {
    category: undefined,
    flowCode: '',
    flowName: '',
    formPath: '',
    id: undefined,
    modelValue: 'CLASSICS',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const categoryTreeData = ref<any[]>([]);

const formRules = ref<AntdFormRules<FormData>>({
  category: [{ required: true, message: $t('ui.formRules.selectRequired') }],
  flowCode: [{ required: true, message: $t('ui.formRules.required') }],
  flowName: [{ required: true, message: $t('ui.formRules.required') }],
  formPath: [{ required: true, message: $t('ui.formRules.required') }],
  modelValue: [{ required: true, message: $t('ui.formRules.selectRequired') }],
});

function formValueGetter() {
  return JSON.stringify(formData.value);
}

async function setupCategorySelect() {
  // menu
  categoryTreeData.value = await categoryTree();
  addFullName(categoryTreeData.value, 'label', ' / ');
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: formValueGetter,
    currentGetter: formValueGetter,
  },
);

const [BasicDrawer, modalApi] = useVbenModal({
  onBeforeClose,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id } = modalApi.getData() as { id?: number | string };
    isUpdate.value = !!id;

    // 加载分类树选择
    await setupCategorySelect();
    if (isUpdate.value && id) {
      const record = await workflowDefinitionInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
      };
    }
    await markInitialized();

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    if (isUpdate.value) {
      await workflowDefinitionUpdate(data);
      emit('reload', 'update');
    } else {
      await workflowDefinitionAdd(data);
      emit('reload', 'add');
    }
    resetInitialized();
    modalApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.lock(false);
  }
}

async function handleClosed() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
  resetInitialized();
}
</script>

<template>
  <BasicDrawer :fullscreen-button="false" :title="title" :size="550">
    <div class="min-h-[400px]">
      <Form
        ref="formInstance"
        :model="formData"
        :label-col="{ style: { width: '90px' } }"
      >
        <FormItem label="流程分类" name="category" :rules="formRules.category">
          <TreeSelect
            class="w-full"
            :field-names="{ label: 'label', value: 'id' }"
            :get-popup-container="getPopupContainer"
            :list-height="300"
            show-search
            :tree-data="categoryTreeData"
            tree-default-expand-all
            :tree-line="{ showLeafIcon: false }"
            tree-node-filter-prop="label"
            tree-node-label-prop="fullName"
            v-model:value="formData.category"
          />
        </FormItem>
        <FormItem label="流程code" name="flowCode" :rules="formRules.flowCode">
          <Input allow-clear class="w-full" v-model:value="formData.flowCode" />
        </FormItem>
        <FormItem label="流程名称" name="flowName" :rules="formRules.flowName">
          <Input allow-clear class="w-full" v-model:value="formData.flowName" />
        </FormItem>
        <FormItem
          label="设计器模式"
          name="modelValue"
          :rules="formRules.modelValue"
        >
          <RadioGroup
            button-style="solid"
            option-type="button"
            :options="designerModeOptions"
            v-model:value="formData.modelValue"
          />
        </FormItem>
        <FormItem label="表单路径" name="formPath" :rules="formRules.formPath">
          <Input allow-clear class="w-full" v-model:value="formData.formPath" />
        </FormItem>
      </Form>
    </div>
  </BasicDrawer>
</template>
