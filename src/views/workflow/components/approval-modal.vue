<!-- 审批同意的弹窗 -->
<script setup lang="ts">
import type { User } from '@/api/system/user/model';
import type {
  CompleteTaskReqData,
  NextNodeInfo,
} from '@/api/workflow/task/model';
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { completeTask, getNextNodeList } from '@/api/workflow/task';
import { useVbenModal } from '@/components';
import { FormTextArea as TextArea } from '@/components/global/form';
import { FileUpload } from '@/components/upload';
import { cloneDeep } from '@/utils';
import { CheckboxGroup, Form, FormItem } from 'antdv-next';
import { omit } from 'lodash-es';

import { CopyComponent } from '.';

const emit = defineEmits<{ complete: [] }>();

interface ModalProps {
  taskId: string;
  // 是否具有抄送权限
  copyPermission: boolean;
  // 是有具有选人权限
  assignPermission: boolean;
}

interface FormData {
  assigneeMap?: Record<string, string>;
  attachment?: string;
  flowCopyList: User[];
  message?: string;
  messageType: string[];
  taskId: string;
}

function getDefaultValues(): FormData {
  return {
    assigneeMap: undefined,
    attachment: '',
    flowCopyList: [],
    message: '',
    messageType: ['1'],
    taskId: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const copyPermission = ref(false);
const assignPermission = ref(false);

const messageTypeOptions = [
  { disabled: true, label: '站内信', value: '1' },
  { label: '邮件', value: '2' },
  { label: '短信', value: '3' },
];

const uploadAccept = 'png, jpg, jpeg, doc, docx, xlsx, xls, ppt, pdf';

// 自定义添加选人属性 给组件v-for绑定
const nextNodeInfo = ref<(NextNodeInfo & { selectUserList: User[] })[]>([]);
const [BasicModal, modalApi] = useVbenModal({
  title: '审批通过',
  fullscreenButton: false,
  class: 'min-h-[365px]',
  onConfirm: handleSubmit,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      handleReset();
      return null;
    }
    modalApi.modalLoading(true);

    const data = modalApi.getData() as ModalProps;
    const { taskId } = data;
    copyPermission.value = data.copyPermission;
    assignPermission.value = data.assignPermission;

    if (assignPermission.value) {
      const resp = await getNextNodeList({ taskId });
      nextNodeInfo.value = resp.map((item) => ({
        ...item,
        selectUserList: [],
      }));
    }

    formData.value.taskId = taskId;

    modalApi.modalLoading(false);
  },
});

async function handleSubmit() {
  try {
    modalApi.modalLoading(true);
    await formInstance.value?.validate();
    const data = cloneDeep(formData.value);
    const flowCopyList = data.flowCopyList.map((item) => ({
      userId: item.userId,
      userName: item.nickName,
    }));
    const requestData = {
      ...omit(data, ['attachment']),
      fileId: data.attachment,
      taskVariables: {},
      variables: {},
      flowCopyList,
    } as CompleteTaskReqData;

    if (assignPermission.value) {
      for (const item of nextNodeInfo.value) {
        if (item.selectUserList.length === 0) {
          window.message.warning(`未选择节点[${item.nodeName}]审批人`);
          return;
        }
      }

      const assigneeMap: { [key: string]: string } = {};
      nextNodeInfo.value.forEach((item) => {
        assigneeMap[item.nodeCode] = item.selectUserList
          .map((u) => u.userId)
          .join(',');
      });
      requestData.assigneeMap = assigneeMap;
    }

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
  assignPermission.value = false;
  nextNodeInfo.value = [];
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
      <FormItem v-if="assignPermission" label="下一步审批人" name="assigneeMap">
        <div class="flex flex-col gap-2">
          <div
            v-for="item in nextNodeInfo"
            :key="item.nodeCode"
            class="flex items-center gap-2"
          >
            <template v-if="item.permissionFlag">
              <span class="opacity-70">{{ item.nodeName }}</span>
              <CopyComponent
                :allow-user-ids="item.permissionFlag"
                v-model:user-list="item.selectUserList"
              />
            </template>
            <template v-else>
              <span class="text-red-500">没有权限, 请联系管理员</span>
            </template>
          </div>
        </div>
      </FormItem>
      <FormItem label="审批意见" name="message" class="items-start">
        <TextArea allow-clear class="w-full" v-model:value="formData.message" />
      </FormItem>
    </Form>
  </BasicModal>
</template>
