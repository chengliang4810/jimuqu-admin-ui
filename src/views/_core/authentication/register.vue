<script lang="ts" setup>
import type { VbenFormSchema } from '@/effects/common-ui';
import type { Recordable } from '@/types';

import { computed, h, ref } from 'vue';

import { AuthenticationRegister } from '@/effects/common-ui';
import { $t } from '@/locales';

defineOptions({ name: 'Register' });

const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: { message: $t('authentication.usernameTip'), required: true },
    },
    {
      component: 'InputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      renderComponentContent() {
        return {
          strengthText: () => $t('authentication.passwordStrength'),
        };
      },
      rules: { message: $t('authentication.passwordTip'), required: true },
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: $t('authentication.confirmPassword'),
      },
      dependencies: {
        rules(values) {
          const { password } = values;
          return [
            { message: $t('authentication.passwordTip'), required: true },
            {
              validator: async (_rule: any, value: any) =>
                value === password
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error($t('authentication.confirmPasswordTip')),
                    ),
            },
          ];
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmPassword'),
    },
    {
      component: 'Checkbox',
      fieldName: 'agreePolicy',
      renderComponentContent: () => ({
        default: () =>
          h('span', [
            $t('authentication.agree'),
            h(
              'a',
              {
                class: 'vben-link ml-1 ',
                href: '',
              },
              `${$t('authentication.privacyPolicy')} & ${$t('authentication.terms')}`,
            ),
          ]),
      }),
      rules: {
        validator: async (_rule: any, value: any) =>
          value
            ? Promise.resolve()
            : Promise.reject(new Error($t('authentication.agreeTip'))),
      },
    },
  ];
});

function handleSubmit(value: Recordable<any>) {
  console.log('register submit:', value);
}
</script>

<template>
  <AuthenticationRegister
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
