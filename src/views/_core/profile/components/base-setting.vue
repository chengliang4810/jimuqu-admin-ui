<script setup lang="ts">
import type { UserProfile } from '@/api/system/profile/model';
import type { Recordable } from '@/types';

import { onMounted } from 'vue';

import { useVbenForm } from '@/adapter/form';
import { userProfileUpdate } from '@/api/system/profile';
import { DictEnum } from '@/constants';
import { useAuthStore, useUserStore } from '@/stores';
import { getDictOptions } from '@/utils/dict';
import { pick } from 'lodash-es';

import { emitter } from '../mitt';

const props = defineProps<{ profile: UserProfile }>();

const userStore = useUserStore();
const authStore = useAuthStore();

const [BasicForm, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 60,
  },
  handleSubmit,
  resetButtonOptions: {
    show: false,
  },
  schema: [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'userId',
      label: '用户ID',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'nickName',
      label: '昵称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
      rules: { message: '请输入正确的邮箱', required: true, type: 'email' },
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: getDictOptions(DictEnum.SYS_USER_GENDER),
        optionType: 'button',
      },
      defaultValue: '0',
      fieldName: 'sex',
      label: '性别',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'phoneNumber',
      label: '电话',
      rules: {
        message: '请输入正确的电话',
        pattern: /^1[3-9]\d{9}$/,
        required: true,
      },
    },
  ],
  submitButtonOptions: {
    content: '更新信息',
  },
});

function buttonLoading(loading: boolean) {
  formApi.setState((prev) => ({
    ...prev,
    submitButtonOptions: { ...prev.submitButtonOptions, loading },
  }));
}

async function handleSubmit(values: Recordable<any>) {
  try {
    buttonLoading(true);
    await userProfileUpdate(values);
    // 更新store
    const userInfo = await authStore.fetchUserInfo();
    userStore.setUserInfo(userInfo);
    // 左边reload
    emitter.emit('updateProfile');
  } catch (error) {
    console.error(error);
  } finally {
    buttonLoading(false);
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
  formApi.setValues(data);
});
</script>

<template>
  <div class="mt-[16px] md:w-full lg:w-1/2 2xl:w-2/5">
    <BasicForm />
  </div>
</template>
