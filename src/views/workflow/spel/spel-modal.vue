<script setup lang="ts">
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { spelAdd, spelInfo, spelUpdate } from '@/api/workflow/spel';
import { useVbenModal } from '@/components';
import {
  FormInput as Input,
  FormTextArea as Textarea,
} from '@/components/global/form';
import { DictEnum } from '@/constants';
import { $t } from '@/locales';
import { cloneDeep } from '@/utils';
import { getDictOptions } from '@/utils/dict';
import { useBeforeCloseDiff } from '@/utils/popup';
import { Form, FormItem, RadioGroup } from 'antdv-next';

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
  viewSpel: [{ required: true, message: $t('ui.formRules.required') }],
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

const [BasicModal, modalApi] = useVbenModal({
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

    // 更新 && 赋值
    if (isUpdate.value && id) {
      const record = await spelInfo(id);
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
    await (isUpdate.value ? spelUpdate(data) : spelAdd(data));
    resetInitialized();
    emit('reload');
    await modalApi.close();
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

const viewSpEL = ref('');

function genSpel(
  _changedValues: Record<string, any>,
  values: Record<string, any>,
) {
  // 组件/方法+参数
  if (!values.componentName || !values.methodName) {
    viewSpEL.value = values.methodParams ? '${' + values.methodParams + '}' : '';
  } else {
    // 组件+方法+参数(多参，分割)
    const params = values.methodParams ? values.methodParams.split(',') : [];
    const methodParamsText = params.map((item: any) => `#${item}`).join(',');
    viewSpEL.value = `#{@${values.componentName}.${values.methodName}(${methodParamsText})}`;
  }
  values.viewSpel = viewSpEL.value;
  console.log('viewSpel', values);
}
</script>

<template>
  <BasicModal :title="title" width="800">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '100px' } }"
      @values-change="genSpel"
    >
      <FormItem label="组件名称" name="componentName">
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.componentName"
        />
      </FormItem>
      <FormItem label="方法名称" name="methodName">
        <Input allow-clear class="w-full" v-model:value="formData.methodName" />
      </FormItem>
      <FormItem label="参数名称" name="methodParams">
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.methodParams"
        />
      </FormItem>
      <FormItem label="SpEL表达式" name="viewSpel" :rules="formRules.viewSpel">
        <Input disabled class="w-full" v-model:value="formData.viewSpel" />
      </FormItem>
      <FormItem label="状态" name="status">
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
  </BasicModal>
</template>
