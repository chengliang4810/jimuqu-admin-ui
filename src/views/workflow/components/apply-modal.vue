<!-- 流程发起(启动)的弹窗 -->

<script setup lang="ts">
import type { User } from '@/api/system/user/model';
import type { CompleteTaskReqData } from '@/api/workflow/task/model';
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { completeTask, getTaskByTaskId } from '@/api/workflow/task';
import { useVbenModal } from '@/components';
import { FileUpload } from '@/components/upload';
import { CheckboxGroup, Form, FormItem } from 'antdv-next';
import { cloneDeep } from 'lodash-es';

import { CopyComponent } from '.';

interface Emits {
  /**
   * 完成
   */
  complete: [];
  /**
   * 取消 此时已经变成草稿状态了
   */
  cancel: [];
}

const emit = defineEmits<Emits>();

interface ModalProps {
  taskId: string;
  taskVariables: Record<string, any>;
  variables?: any; // 这个干啥的
}

interface FormData {
  attachment?: string;
  flowCopyList: User[];
  messageType: string[];
}

function getDefaultValues(): FormData {
  return {
    attachment: '',
    flowCopyList: [],
    messageType: ['1'],
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const copyPermission = ref(false);

const messageTypeOptions = [
  { disabled: true, label: '站内信', value: '1' },
  { label: '邮件', value: '2' },
  { label: '短信', value: '3' },
];

const uploadAccept = 'png, jpg, jpeg, doc, docx, xlsx, xls, ppt, pdf';

const [BasicModal, modalApi] = useVbenModal({
  title: '流程发起',
  fullscreenButton: false,
  onConfirm: handleSubmit,
  onCancel: () => {
    emit('cancel');
    modalApi.close();
    handleReset();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      handleReset();
      return null;
    }
    modalApi.modalLoading(true);

    const { taskId } = modalApi.getData() as ModalProps;

    const resp = await getTaskByTaskId(taskId);
    const buttonPermissions: Record<string, boolean> = {};
    resp.buttonList.forEach((item) => {
      buttonPermissions[item.code] = item.show;
    });

    copyPermission.value = buttonPermissions?.copy ?? false;

    modalApi.modalLoading(false);
  },
});

async function handleSubmit() {
  try {
    modalApi.modalLoading(true);
    const { messageType, flowCopyList, attachment } = cloneDeep(formData.value);
    const { taskId, taskVariables, variables } =
      modalApi.getData() as ModalProps;
    const flowCCList = flowCopyList.map((item) => ({
      userId: item.userId,
      userName: item.nickName,
    }));
    const requestData = {
      fileId: attachment,
      messageType,
      flowCopyList: flowCCList,
      taskId,
      taskVariables,
      variables,
    } as CompleteTaskReqData;
    await completeTask(requestData);
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
  copyPermission.value = false;
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
      <FormItem label="附件上传" name="attachment" class="items-start">
        <FileUpload
          :accept="uploadAccept"
          :max-count="10"
          :max-size="20"
          v-model:value="formData.attachment"
        />
      </FormItem>
      <FormItem v-if="copyPermission" label="抄送人" name="flowCopyList">
        <CopyComponent v-model:user-list="formData.flowCopyList" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
