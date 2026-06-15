<script setup lang="ts">
import type { VbenFormSchema } from '@/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting } from '@/effects/common-ui';

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: '旧密码',
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入旧密码',
      },
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'InputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'InputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return [
            { message: '请再次输入新密码', required: true },
            {
              validator: async (_rule: any, value: any) =>
                value === newPassword
                  ? Promise.resolve()
                  : Promise.reject(new Error('两次输入的密码不一致')),
            },
          ];
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

function handleSubmit() {
  window.message.success('密码修改成功');
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
