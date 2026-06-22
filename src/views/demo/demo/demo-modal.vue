<script setup lang="ts">
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import type { DemoForm } from './api/model';

import { computed, ref } from 'vue';

import { useVbenModal } from '@/components';
import {
  FormInput as Input,
  FormInputNumber as InputNumber,
} from '@/components/global/form';
import { $t } from '@/locales';
import { cloneDeep } from '@/utils';
import { Form, FormItem } from 'antdv-next';

import { demoAdd, demoInfo, demoUpdate } from './api';

const emit = defineEmits<{ reload: [] }>();

const isUpdate = ref(false);
const title = computed(() => {
  return isUpdate.value ? $t('pages.common.edit') : $t('pages.common.add');
});

function getDefaultValues(): DemoForm {
  return {
    id: undefined,
    orderNum: undefined,
    testKey: '',
    value: '',
    version: undefined,
  };
}

const formData = ref<DemoForm>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formRules = ref<AntdFormRules<DemoForm>>({
  orderNum: [{ required: true, message: $t('ui.formRules.required') }],
  testKey: [{ required: true, message: $t('ui.formRules.required') }],
  value: [{ required: true, message: $t('ui.formRules.required') }],
  version: [{ required: true, message: $t('ui.formRules.required') }],
});

const [BasicModal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel: handleCancel,
  onConfirm: handleConfirm,
  onOpenChange: async (isOpen) => {
    if (!isOpen) {
      return null;
    }
    modalApi.modalLoading(true);

    const { id } = modalApi.getData() as { id?: number | string };
    isUpdate.value = !!id;

    if (isUpdate.value && id) {
      const record = await demoInfo(id);
      formData.value = {
        ...getDefaultValues(),
        ...record,
      };
    }

    modalApi.modalLoading(false);
  },
});

async function handleConfirm() {
  try {
    modalApi.modalLoading(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    await (isUpdate.value ? demoUpdate(data) : demoAdd(data));
    emit('reload');
    await handleCancel();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}

async function handleCancel() {
  modalApi.close();
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
}
</script>

<template>
  <BasicModal :close-on-click-modal="false" :title="title" :width="550">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem label="排序号" name="orderNum" :rules="formRules.orderNum">
        <InputNumber class="w-full" v-model:value="formData.orderNum" />
      </FormItem>
      <FormItem label="key键" name="testKey" :rules="formRules.testKey">
        <Input allow-clear class="w-full" v-model:value="formData.testKey" />
      </FormItem>
      <FormItem label="值" name="value" :rules="formRules.value">
        <Input allow-clear class="w-full" v-model:value="formData.value" />
      </FormItem>
      <FormItem label="版本" name="version" :rules="formRules.version">
        <InputNumber class="w-full" v-model:value="formData.version" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
