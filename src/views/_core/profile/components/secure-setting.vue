<script setup lang="ts">
import type { UpdatePasswordParam } from '@/api/system/profile/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { ref } from 'vue';

import { userUpdatePassword } from '@/api/system/profile';
import { FormInputPassword as InputPassword } from '@/components/global/form';
import { useAuthStore } from '@/stores';
import { Button, Form, FormItem } from 'antdv-next';
import { omit } from 'lodash-es';

interface FormData extends UpdatePasswordParam {
  confirmPassword?: string;
}

function getDefaultValues(): FormData {
  return {
    confirmPassword: '',
    newPassword: '',
    oldPassword: '',
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const submitLoading = ref(false);
const authStore = useAuthStore();

const passwordRules = [
  { message: '密码长度不能少于5个字符', min: 5 },
  { message: '密码长度不能超过20个字符', max: 20 },
];

const formRules = ref<AntdFormRules<FormData>>({
  confirmPassword: [
    { message: '请输入确认密码', required: true },
    ...passwordRules,
    {
      validator: async (_rule: any, value: any) => {
        if (value !== formData.value.newPassword) {
          throw new Error('新密码和确认密码不一致');
        }
        return;
      },
    },
  ],
  newPassword: [
    { message: '请输入新密码', required: true },
    ...passwordRules,
    {
      validator: async (_rule: any, value: any) => {
        if (value === formData.value.oldPassword) {
          throw new Error('新旧密码不能相同');
        }
        return;
      },
    },
  ],
  oldPassword: [{ message: '请输入密码', required: true }, ...passwordRules],
});

async function handleSubmit() {
  await formInstance.value?.validate();
  window.modal.confirm({
    content: '确认修改密码吗？',
    onOk: async () => {
      try {
        submitLoading.value = true;
        const data = omit(formData.value, [
          'confirmPassword',
        ]) as UpdatePasswordParam;
        await userUpdatePassword(data);
        await authStore.logout(true);
      } catch (error) {
        console.error(error);
      } finally {
        submitLoading.value = false;
      }
    },
    title: '提示',
  });
}
</script>

<template>
  <div class="mt-[16px] md:w-full lg:w-1/2 2xl:w-2/5">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '90px' } }"
    >
      <FormItem
        label="旧密码"
        name="oldPassword"
        :rules="formRules.oldPassword"
      >
        <InputPassword class="w-full" v-model:value="formData.oldPassword" />
      </FormItem>
      <FormItem
        label="新密码"
        name="newPassword"
        :rules="formRules.newPassword"
      >
        <InputPassword class="w-full" v-model:value="formData.newPassword" />
      </FormItem>
      <FormItem
        label="确认密码"
        name="confirmPassword"
        :rules="formRules.confirmPassword"
      >
        <InputPassword
          class="w-full"
          v-model:value="formData.confirmPassword"
        />
      </FormItem>
      <FormItem>
        <Button type="primary" :loading="submitLoading" @click="handleSubmit">
          修改密码
        </Button>
      </FormItem>
    </Form>
  </div>
</template>
