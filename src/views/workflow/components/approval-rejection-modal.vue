<!-- 审批驳回窗口 -->
<script setup lang="ts">
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { backProcess, getBackTaskNode } from '@/api/workflow/task';
import {
  FormSelect as Select,
  FormTextArea as TextArea,
} from '@/components/global/form';
import { FileUpload } from '@/components/upload';
import { useVbenModal } from '@/components';
import { $t } from '@/locales';
import { cloneDeep, getPopupContainer } from '@/utils';
import { CheckboxGroup, Form, FormItem } from 'antdv-next';

const emit = defineEmits<{ complete: [] }>();

interface ModalProps {
  taskId: string;
  definitionId: string;
  nodeCode: string;
}

interface FormData {
  attachment?: string;
  message?: string;
  messageType: string[];
  nodeCode?: string;
  taskId: string;
}

function getDefaultValues(): FormData {
  return {
    attachment: '',
    message: '',
    messageType: ['1'],
    nodeCode: undefined,
    taskId: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const nodeOptions = ref<{ label: string; value: string }[]>([]);

const messageTypeOptions = [
  { disabled: true, label: '站内信', value: '1' },
  { label: '邮件', value: '2' },
  { label: '短信', value: '3' },
];

const uploadAccept = 'png, jpg, jpeg, doc, docx, xlsx, xls, ppt, pdf';

const formRules = ref<AntdFormRules<FormData>>({
  nodeCode: [{ required: true, message: $t('ui.formRules.selectRequired') }],
});

const [BasicModal, modalApi] = useVbenModal({
  title: '审批驳回',
  fullscreenButton: false,
  class: 'min-h-[365px]',
  onConfirm: handleSubmit,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      handleReset();
      return null;
    }
    modalApi.modalLoading(true);

    const { taskId, nodeCode } = modalApi.getData() as ModalProps;
    formData.value.taskId = taskId;

    const resp = await getBackTaskNode(taskId, nodeCode);
    nodeOptions.value = resp.map((item) => ({
      label: item.nodeName,
      value: item.nodeCode,
    }));
    if (nodeOptions.value.length > 0) {
      formData.value.nodeCode = nodeOptions.value[0]?.value;
    }

    modalApi.modalLoading(false);
  },
});

async function handleSubmit() {
  try {
    modalApi.modalLoading(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value) as FormData & {
      attachment?: string | undefined;
      fileId?: string;
    };
    data.fileId = data.attachment;
    data.attachment = undefined;
    await backProcess(data);
    modalApi.close();
    emit('complete');
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.modalLoading(false);
  }
}

function handleReset() {
  formData.value = getDefaultValues();
  nodeOptions.value = [];
  formInstance.value?.resetFields();
}
</script>

<template>
  <BasicModal>
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '100px' } }"
    >
      <FormItem label="通知方式" name="messageType">
        <CheckboxGroup
          :options="messageTypeOptions"
          v-model:value="formData.messageType"
        />
      </FormItem>
      <FormItem label="驳回节点" name="nodeCode" :rules="formRules.nodeCode">
        <Select
          class="w-full"
          :get-popup-container="getPopupContainer"
          :options="nodeOptions"
          v-model:value="formData.nodeCode"
        />
      </FormItem>
      <FormItem label="附件上传" name="attachment" class="items-start">
        <FileUpload
          :accept="uploadAccept"
          :max-count="10"
          :max-size="20"
          v-model:value="formData.attachment"
        />
      </FormItem>
      <FormItem label="审批意见" name="message" class="items-start">
        <TextArea allow-clear class="w-full" v-model:value="formData.message" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
