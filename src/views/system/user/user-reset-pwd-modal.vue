<script setup lang="ts">
import type { ResetPwdParam, User } from '@/api/system/user/model';
import type { AntdFormRules } from '@/types/form';
import type { DescriptionsProps, FormInstance } from 'antdv-next';

import { computed, ref } from 'vue';

import { userResetPassword } from '@/api/system/user';
import { useVbenModal } from '@/components';
import { Descriptions, Form, FormItem, InputPassword } from 'antdv-next';

const emit = defineEmits<{ reload: [] }>();

const defaultValues: ResetPwdParam = {
  userId: '',
  password: '',
};

const formData = ref<ResetPwdParam>({ ...defaultValues });
const formInstance = ref<FormInstance>();
const formRules = ref<AntdFormRules<ResetPwdParam>>({
  password: [
    { message: '密码长度为5 - 20', required: true },
    { max: 20, message: '密码长度为5 - 20', min: 5 },
  ],
});

const [BasicModal, modalApi] = useVbenModal({
  onClosed: handleClosed,
  onConfirm: handleSubmit,
  onOpenChange: handleOpenChange,
});

const currentUser = ref<null | User>(null);
async function handleOpenChange(open: boolean) {
  if (!open) {
    return null;
  }
  modalApi.modalLoading(true);

  const { record } = modalApi.getData() as { record: User };
  currentUser.value = record;
  formData.value = { ...defaultValues, userId: record.userId };

  modalApi.modalLoading(false);
}

async function handleSubmit() {
  try {
    modalApi.lock(true);
    await formInstance.value?.validate();
    await userResetPassword(formData.value);
    emit('reload');
    modalApi.close();
  } catch (error) {
    console.error(error);
  } finally {
    modalApi.lock(false);
  }
}

function handleClosed() {
  formData.value = { ...defaultValues };
  formInstance.value?.resetFields();
  currentUser.value = null;
}

const items = computed<DescriptionsProps['items']>(() => {
  if (!currentUser.value) {
    return [];
  }
  return [
    { label: '用户ID', content: currentUser.value.userId },
    { label: '用户名', content: currentUser.value.userName },
    { label: '昵称', content: currentUser.value.nickName },
  ];
});
</script>

<template>
  <BasicModal
    :close-on-click-modal="false"
    :fullscreen-button="false"
    title="重置密码"
  >
    <div class="flex flex-col gap-[12px]">
      <Descriptions size="small" :column="1" bordered :items="items" />
      <Form layout="vertical" ref="formInstance" :model="formData">
        <FormItem label="新的密码" name="password" :rules="formRules.password">
          <InputPassword
            allow-clear
            :maxlength="20"
            placeholder="请输入新的密码, 密码长度为5 - 20"
            v-model:value="formData.password"
          />
        </FormItem>
      </Form>
    </div>
  </BasicModal>
</template>
