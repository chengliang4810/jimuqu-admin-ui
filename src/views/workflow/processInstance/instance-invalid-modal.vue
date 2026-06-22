<script setup lang="ts">
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { workflowInstanceInvalid } from '@/api/workflow/instance';
import { FormTextArea as Textarea } from '@/components/global/form';
import { useVbenModal } from '@/components';
import { $t } from '@/locales';
import { Form, FormItem } from 'antdv-next';
import { cloneDeep } from 'lodash-es';

const emit = defineEmits<{ reload: [] }>();

interface FormData {
  comment?: string;
  id?: number | string;
}

function getDefaultValues(): FormData {
  return {
    comment: '',
    id: undefined,
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();

const formRules = ref<AntdFormRules<FormData>>({
  comment: [{ required: true, message: $t('ui.formRules.required') }],
});

const [BasicModal, modalApi] = useVbenModal({
  onConfirm: handleSubmit,
  onCancel: handleCancel,
  fullscreenButton: false,
  title: '作废原因',
});

async function handleCancel() {
  modalApi.close();
  formData.value = getDefaultValues();
  formInstance.value?.resetFields();
}

async function handleSubmit() {
  try {
    modalApi.modalLoading(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    data.id = modalApi.getData().id;
    await workflowInstanceInvalid(data as any);
    emit('reload');
    handleCancel();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}
</script>

<template>
  <BasicModal>
    <Form layout="vertical" ref="formInstance" :model="formData">
      <FormItem label="作废原因" name="comment" :rules="formRules.comment">
        <Textarea class="w-full" v-model:value="formData.comment" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
