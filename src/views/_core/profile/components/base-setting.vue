<script setup lang="ts">
import type { UserProfile } from '@/api/system/profile/model';
import type { AntdFormRules } from '@/types/form';
import type { FormInstance } from 'antdv-next';

import { onMounted, ref } from 'vue';

import { userProfileUpdate } from '@/api/system/profile';
import { FormInput as Input } from '@/components/global/form';
import { DictEnum } from '@/constants';
import { useAuthStore, useUserStore } from '@/stores';
import { getDictOptions } from '@/utils/dict';
import { Button, Form, FormItem, RadioGroup } from 'antdv-next';
import { pick } from 'lodash-es';

import { emitter } from '../mitt';

const props = defineProps<{ profile: UserProfile }>();

const userStore = useUserStore();
const authStore = useAuthStore();

interface FormData {
  email?: string;
  nickName?: string;
  phoneNumber?: string;
  sex?: string;
  userId?: number | string;
}

function getDefaultValues(): FormData {
  return {
    email: '',
    nickName: '',
    phoneNumber: '',
    sex: '0',
    userId: undefined,
  };
}

const formData = ref<FormData>(getDefaultValues());
const formInstance = ref<FormInstance>();
const submitLoading = ref(false);

const formRules = ref<AntdFormRules<FormData>>({
  email: [{ message: '请输入正确的邮箱', required: true, type: 'email' }],
  nickName: [{ message: '请输入昵称', required: true }],
  phoneNumber: [
    {
      message: '请输入正确的电话',
      pattern: /^1[3-9]\d{9}$/,
      required: true,
    },
  ],
  sex: [{ message: '请选择性别', required: true }],
});

async function handleSubmit() {
  try {
    submitLoading.value = true;
    await formInstance.value?.validate();
    await userProfileUpdate(formData.value);
    // 更新store
    const userInfo = await authStore.fetchUserInfo();
    userStore.setUserInfo(userInfo);
    // 左边reload
    emitter.emit('updateProfile');
  } catch (error) {
    console.error(error);
  } finally {
    submitLoading.value = false;
  }
}

onMounted(() => {
  const data = pick(props.profile.user, [
    'userId',
    'nickName',
    'email',
    'phoneNumber',
    'sex',
  ]);
  formData.value = {
    ...getDefaultValues(),
    ...data,
  };
});
</script>

<template>
  <div class="mt-[16px] md:w-full lg:w-1/2 2xl:w-2/5">
    <Form
      ref="formInstance"
      :model="formData"
      :label-col="{ style: { width: '80px' } }"
    >
      <FormItem name="userId" hidden>
        <Input v-model:value="formData.userId" />
      </FormItem>
      <FormItem label="昵称" name="nickName" :rules="formRules.nickName">
        <Input allow-clear class="w-full" v-model:value="formData.nickName" />
      </FormItem>
      <FormItem label="邮箱" name="email" :rules="formRules.email">
        <Input allow-clear class="w-full" v-model:value="formData.email" />
      </FormItem>
      <FormItem label="性别" name="sex" :rules="formRules.sex">
        <RadioGroup
          button-style="solid"
          option-type="button"
          :options="getDictOptions(DictEnum.SYS_USER_GENDER)"
          v-model:value="formData.sex"
        />
      </FormItem>
      <FormItem label="电话" name="phoneNumber" :rules="formRules.phoneNumber">
        <Input
          allow-clear
          class="w-full"
          v-model:value="formData.phoneNumber"
        />
      </FormItem>
      <FormItem>
        <div class="flex items-center justify-end">
          <Button type="primary" :loading="submitLoading" @click="handleSubmit">
            更新信息
          </Button>
        </div>
      </FormItem>
    </Form>
  </div>
</template>
