<script setup lang="ts">
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { spelAdd, spelInfo, spelUpdate } from '@/api/workflow/spel';
import {
  FormInput as Input,
  FormTextArea as Textarea,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { useVbenDrawer } from '@/effects/common-ui';
import { $t } from '@/locales';
import { cloneDeep } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

import { generateSpel } from './common';
import SpelPreviewer from './spel-previewer.vue';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

interface FormData {
  componentName?: string;
  id?: number;
  methodName?: string;
  methodParams?: string;
  remark?: string;
  status?: string;
  viewSpel?: string;
}

function getDefaultValues(): FormData {
  return {
    componentName: '',
    id: undefined,
    methodName: '',
    methodParams: '',
    remark: '',
    status: '0',
    viewSpel: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formRules = ref<AntdFormRules<FormData>>({
  componentName: [{ required: true, message: $t('ui.formRules.required') }],
  methodName: [{ required: true, message: $t('ui.formRules.required') }],
  status: [{ required: true, message: $t('ui.formRules.required') }],
});

function formValueGetter() {
  return JSON.stringify(formData.value);
}

const { onBeforeClose, markInitialized, resetInitialized } = useBeforeCloseDiff(
  {
    initializedGetter: formValueGetter,
    currentGetter: formValueGetter,
  },
);

const [BasicDrawer, drawerApi] = useVbenDrawer({
  onBeforeClose,
  onClosed: handleClosed,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return null;
    }
    drawerApi.drawerLoading(true);
    const { id } = drawerApi.getData() as { id?: number | string };
    isUpdate.value = !!id;

    // 更新 && 赋值
    if (isUpdate.value && id) {
      const record = await spelInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
      };
    }
    await markInitialized();
    drawerApi.drawerLoading(false);
  },
});

async function handleConfirm() {
  try {
    drawerApi.lock(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    if (isUpdate.value) {
      await spelUpdate(data);
    } else {
      // 新增需要生成
      data.viewSpel = generateSpel(data);
      await spelAdd(data);
    }
    resetInitialized();
    emit('reload');
    drawerApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    drawerApi.lock(false);
  }
}

async function handleClosed() {
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
  resetInitialized();
}
</script>

<template>
  <BasicDrawer :title="title" :size="600">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem
        label="组件名称"
        name="componentName"
        :rules="formRules.componentName"
      >
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.componentName"
        />
      </FormItem>
      <FormItem
        label="方法名称"
        name="methodName"
        :rules="formRules.methodName"
      >
        <Input allow-clear class="w-full" v-model:value="formData.methodName" />
      </FormItem>
      <FormItem label="参数名称" name="methodParams">
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.methodParams"
        />
      </FormItem>
      <FormItem label="Spel表达式" name="viewSpel">
        <SpelPreviewer
          :component-name="formData.componentName"
          :method-name="formData.methodName"
          :method-params="formData.methodParams"
        />
      </FormItem>
      <FormItem label="状态" name="status" :rules="formRules.status">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_NORMAL_DISABLE)"
          v-model:value="formData.status"
        />
      </FormItem>
      <FormItem label="备注" name="remark" class="items-start">
        <Textarea allow-clear class="w-full" v-model:value="formData.remark" />
      </FormItem>
    </Form>
  </BasicDrawer>
</template>
