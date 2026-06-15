<script lang="ts" setup>
import type { VbenFormSchema } from '@/adapter/form';
import type { Recordable } from '@/types';

import { computed, ref } from 'vue';

import { AuthenticationForgetPassword } from '@/effects/common-ui';
import { $t } from '@/locales';

defineOptions({ name: 'ForgetPassword' });

const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: 'example@example.com',
        size: 'large',
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: [
        { message: $t('authentication.emailTip'), required: true },
        { message: $t('authentication.emailValidErrorTip'), type: 'email' },
      ],
    },
  ];
});

function handleSubmit(value: Recordable<any>) {
  console.log('reset email:', value);
}
</script>

<template>
  <AuthenticationForgetPassword
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
